import { getTotalRevenue } from "@/action/get-total-revenue";
import { getSalesCount } from "@/action/get-sale-count";
import { getStockCount } from "@/action/get-stock-count";
import { getGraphRevenue } from "@/action/get-graph-revenue";
import { getNewStats } from "@/action/get-new-stats";
import { getRecentOrders } from "@/action/get-recent-orders";
import { DashboardClient } from "./page-client";

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
  const { storeId } = await params;

  // Run all queries in parallel for better performance
  const [totalRevenue, salesCount, stockCount, graphRevenue, newStats, recentOrders] =
    await Promise.all([
      getTotalRevenue(storeId),
      getSalesCount(storeId),
      getStockCount(storeId),
      getGraphRevenue(storeId),
      getNewStats(storeId),
      getRecentOrders(storeId),
    ]);

  return (
    <DashboardClient
      totalRevenue={totalRevenue}
      salesCount={salesCount}
      stockCount={stockCount}
      graphRevenue={graphRevenue}
      newStats={newStats}
      recentOrders={recentOrders}
    />
  );
};

export default DashboardPage;
