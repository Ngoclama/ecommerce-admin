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

const DashboardPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;
  
  const totalRevenue = await getTotalRevenue(storeId);
  const salesCount = await getSalesCount(storeId);
  const stockCount = await getStockCount(storeId);
  const graphRevenue = await getGraphRevenue(storeId);
  const categoryRevenue = await getCategoryRevenue(storeId); 

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
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;