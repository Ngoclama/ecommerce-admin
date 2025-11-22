// src/app/(dashboard)/[storeId]/(routes)/page.tsx
import { getGraphRevenue } from "@/action/get-graph-revenue";
import getSalesCount from "@/action/get-sale-count";
import getStockCount from "@/action/get-stock-count";
import getTotalRevenue from "@/action/get-total-revenue";
import { getCategoryRevenue } from "@/action/get-category-revenue";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/prisma";
import { formatter } from "@/lib/utils";
import { CreditCard, DollarSign, Package } from "lucide-react";
import Overview from "@/components/overview";
import { OverviewPie } from "@/components/overview-pie";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ShoppingBag } from "lucide-react";
import { getRecentOrders } from "@/action/get-recent-orders";
const DashboardPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

 const [
    totalRevenue,
    salesCount,
    stockCount,
    graphRevenue,
    categoryRevenue,
    recentOrders
  ] = await Promise.all([
    getTotalRevenue(storeId),
    getSalesCount(storeId),
    getStockCount(storeId),
    getGraphRevenue(storeId),
    getCategoryRevenue(storeId),
    getRecentOrders(storeId)
  ]);
  return (
    <div className="flex-col">
      <div className="flex-1 p-8 pt-6 space-y-4">
        <Heading title="Dashboard" description="Tổng quan cửa hàng của bạn" />
        <Separator />

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Tổng Doanh Thu
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{salesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Sản phẩm tồn kho
              </CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Doanh thu theo tháng</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview data={graphRevenue} />
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Doanh thu theo Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <OverviewPie data={categoryRevenue} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Đơn hàng gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentOrders.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có đơn hàng nào.
                    </p>
                  )}
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={order.user?.imageUrl || ""}
                          alt="Avatar"
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {order.user?.name || "Khách vãng lai"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.phone || order.user?.email}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        +{formatter.format(order.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
