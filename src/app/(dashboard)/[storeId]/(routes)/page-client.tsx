// Client Component wrapper cho Dashboard để sử dụng translations
// Server Component không thể dùng hooks, nên cần wrapper này

"use client";

import {
  CreditCard,
  DollarSign,
  Package,
  Users,
  Star,
  Box,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/overview";
import { OverviewPie } from "@/components/overview-pie";
import { formatter } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GraphData {
  name: string;
  total: number;
}

interface ProductDistribution {
  name: string;
  value: number;
}

interface RecentOrder {
  id: string;
  createdAt: Date;
  status?: string | null;
  orderItems: Array<{
    productName: string | null;
    product: {
      name: string;
      category?: {
        name: string;
      } | null;
    } | null;
  }>;
  user: {
    name: string | null;
  } | null;
  total: number | null;
  isPaid: boolean;
}

interface DashboardClientProps {
  totalRevenue: number;
  salesCount: number;
  stockCount: number;
  graphRevenue: GraphData[];
  newStats: {
    newUsersCount: number;
    totalVIPUsers: number;
    newProductsCount: number;
    productDistribution: ProductDistribution[];
  };
  recentOrders: RecentOrder[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  totalRevenue,
  salesCount,
  stockCount,
  graphRevenue,
  newStats,
  recentOrders,
}) => {
  const { t } = useTranslation();
  const params = useParams();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardTransition = (i: number) => ({
    delay: i * 0.1,
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1] as const,
  });

  const glassCardEffect =
    "rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 hover:-translate-y-1";

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6">
        {/* Header với animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Heading
            title={t("dashboard.title")}
            description={t("dashboard.description")}
          />
        </motion.div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(0)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.totalRevenue")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/20 flex items-center justify-center shadow-sm"
                >
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatter.format(totalRevenue)}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+20.1% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(1)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.sales")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center shadow-sm"
                >
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  +{salesCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+19% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(2)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.productsInStock")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center shadow-sm"
                >
                  <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stockCount}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  In stock
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(3)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.newUsers")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/20 flex items-center justify-center shadow-sm"
                >
                  <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  +{newStats.newUsersCount}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(4)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.totalVIPUsers")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/20 flex items-center justify-center shadow-sm"
                >
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {newStats.totalVIPUsers}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total VIP members
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(5)}
          >
            <Card className={glassCardEffect}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.newProducts")}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 w-12 rounded-xl bg-linear-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/20 flex items-center justify-center shadow-sm"
                >
                  <Box className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  +{newStats.newProductsCount}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(6)}
            className="lg:col-span-2"
          >
            <Card className={glassCardEffect}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {t("dashboard.revenueChart")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={graphRevenue} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={cardTransition(7)}
          >
            <Card className={glassCardEffect}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {t("dashboard.productDistribution")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.byCategory")}
                </p>
              </CardHeader>
              <CardContent className="pl-2 flex justify-center">
                <OverviewPie data={newStats.productDistribution} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Orders Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={cardTransition(8)}
        >
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {t("dashboard.recentOrders")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="group transition-all duration-300 hover:scale-105"
              >
                <Link
                  href={`/${params.storeId}/orders`}
                  className="flex items-center gap-1"
                >
                  {t("dashboard.seeAll")}
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                      <TableHead className="font-semibold">
                        {t("columns.products")}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t("columns.category")}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t("columns.price")}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t("columns.status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          {t("modals.noDataFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentOrders.slice(0, 5).map((order, index: number) => {
                        const firstItem = order.orderItems?.[0];
                        const productName =
                          firstItem?.productName ||
                          firstItem?.product?.name ||
                          "N/A";
                        const category =
                          firstItem?.product?.category?.name || "N/A";
                        const statusColors: Record<string, string> = {
                          PENDING:
                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          PROCESSING:
                            "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          SHIPPED:
                            "bg-purple-500/10 text-purple-500 border-purple-500/20",
                          DELIVERED:
                            "bg-green-500/10 text-green-500 border-green-500/20",
                          CANCELLED:
                            "bg-red-500/10 text-red-500 border-red-500/20",
                        };
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-gray-200/50 dark:border-gray-800/50 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                          >
                            <TableCell className="font-medium py-4">
                              {productName}
                            </TableCell>
                            <TableCell className="py-4">{category}</TableCell>
                            <TableCell className="py-4 font-semibold">
                              {formatter.format(Number(order.total || 0))}
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge
                                variant="outline"
                                className={
                                  (order.status &&
                                    statusColors[order.status]) ||
                                  "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                }
                              >
                                {order.status || "PENDING"}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
