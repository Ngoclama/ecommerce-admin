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

  // Format dữ liệu cho bảng
  const formattedUsers: UserColumn[] = users.map((item) => ({
    id: item.id,
    name: item.name || "No name",
    email: item.email,
    role: item.role,
    isVIP: item.isVIP,
    isBanned: item.isBanned,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserClient data={formattedUsers} />
      </div>
    </div>
  );
};

export default UsersPage;
