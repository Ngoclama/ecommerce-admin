import {
  CreditCard,
  DollarSign,
  Package,
  Users,
  Star,
  Box,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/overview";
import { OverviewPie } from "@/components/overview-pie"; 
import { formatter } from "@/lib/utils";

import { getTotalRevenue } from "@/action/get-total-revenue";
import { getSalesCount } from "@/action/get-sale-count";
import { getStockCount } from "@/action/get-stock-count";
import { getGraphRevenue } from "@/action/get-graph-revenue";
import { getNewStats } from "@/action/get-new-stats"; 

interface DashboardPageProps {
  params: { storeId: string };
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
  const totalRevenue = await getTotalRevenue(params.storeId);
  const salesCount = await getSalesCount(params.storeId);
  const stockCount = await getStockCount(params.storeId);
  const graphRevenue = await getGraphRevenue(params.storeId);
  const newStats = await getNewStats(params.storeId);

  const glassCardEffect =
    "rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-md transition-all hover:shadow-lg";

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-24">
        {/* Header */}
        <div className="rounded-2xl px-6 py-4 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm">
          <Heading title="Dashboard" description="Tổng quan cửa hàng của bạn" />
        </div>
        <Separator />

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Doanh Thu
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatter.format(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã Bán</CardTitle>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                +{salesCount}
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sản Phẩm Trong Kho
              </CardTitle>
              <Package className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stockCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Users Mới (Tháng)
              </CardTitle>
              <Users className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                +{newStats.newUsersCount}
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng VIP Users
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {newStats.totalVIPUsers}
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sản Phẩm Mới (Tháng)
              </CardTitle>
              <Box className="h-5 w-5 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                +{newStats.newProductsCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className={`${glassCardEffect} lg:col-span-2`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Biểu Đồ Doanh Thu (12 Tháng)
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview data={graphRevenue} />
            </CardContent>
          </Card>

          <Card className={glassCardEffect}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Phân Phối Sản Phẩm
              </CardTitle>
              <p className="text-xs text-muted-foreground">Theo Danh mục</p>
            </CardHeader>
            <CardContent className="pl-2 flex justify-center">
              <OverviewPie data={newStats.productDistribution} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
