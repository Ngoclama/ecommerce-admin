import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { UserClient } from "./components/client";
import { UserColumn } from "./components/columns";

const UsersPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;
  
  // Lấy danh sách users
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format dữ liệu cho bảng và tính số lượng sản phẩm đã mua
  const formattedUsers: UserColumn[] = await Promise.all(
    users.map(async (item) => {
      // Tự động link orders với user dựa trên email trước khi query
      if (item.email) {
        try {
          const normalizedEmail = item.email.toLowerCase().trim();
          
          // Link orders với exact email match
          await prisma.order.updateMany({
            where: {
              userId: null,
              storeId: storeId,
              email: item.email, // Exact match
            },
            data: {
              userId: item.id,
            },
          });
          
          // Link orders với normalized email match
          if (normalizedEmail !== item.email) {
            const ordersToLink = await prisma.order.findMany({
              where: {
                userId: null,
                storeId: storeId,
                email: normalizedEmail,
              },
              select: {
                id: true,
              },
            });

            if (ordersToLink.length > 0) {
              await Promise.all(
                ordersToLink.map((order) =>
                  prisma.order.update({
                    where: { id: order.id },
                    data: { userId: item.id },
                  })
                )
              );
            }
          }
          
          // Fallback: Find all unlinked orders and filter by email (case-insensitive)
          const allUnlinkedOrders = await prisma.order.findMany({
            where: {
              userId: null,
              storeId: storeId,
              email: { not: null },
            },
            select: {
              id: true,
              email: true,
            },
            take: 100,
          });

          const matchingOrders = allUnlinkedOrders.filter(
            (order) => order.email && order.email.toLowerCase().trim() === normalizedEmail
          );

          if (matchingOrders.length > 0) {
            await Promise.all(
              matchingOrders.map((order) =>
                prisma.order.update({
                  where: { id: order.id },
                  data: { userId: item.id },
                })
              )
            );
          }
        } catch (linkError) {
          console.error(`[USERS_PAGE] Error auto-linking orders for user ${item.id}:`, linkError);
          // Continue even if linking fails
        }
      }

      // Query orders cho user này - sau khi đã link
      const normalizedEmail = item.email ? item.email.toLowerCase().trim() : null;
      
      const whereClause: any = {
        storeId: storeId,
        OR: [
          { userId: item.id }, // Orders đã link với user
          ...(item.email ? [
            { email: item.email }, // Exact email match
            ...(normalizedEmail && normalizedEmail !== item.email ? [{ email: normalizedEmail }] : []), // Normalized match
          ] : []),
        ],
      };

      // Lấy orders với orderItems để tính tổng quantity
      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            select: {
              quantity: true,
            },
          },
        },
      });

      // Tính tổng số lượng sản phẩm đã mua (tổng quantity của tất cả orderItems)
      const totalProductsPurchased = orders.reduce((total, order) => {
        const orderItemsTotal = order.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        return total + orderItemsTotal;
      }, 0);

      // Log để debug
      if (process.env.NODE_ENV === "development" && orders.length > 0) {
        console.log(`[USERS_PAGE] User ${item.email}:`, {
          userId: item.id,
          ordersCount: orders.length,
          totalProductsPurchased,
          orderIds: orders.map((o) => o.id),
        });
      }

      return {
        id: item.id,
        name: item.name || "No name",
        email: item.email,
        role: item.role,
        isVIP: item.isVIP,
        isBanned: item.isBanned,
        totalProductsPurchased: totalProductsPurchased,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
      };
    })
  );

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserClient data={formattedUsers} />
      </div>
    </div>
  );
};

export default UsersPage;
