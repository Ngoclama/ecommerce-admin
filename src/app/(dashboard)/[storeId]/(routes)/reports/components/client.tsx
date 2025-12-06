"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatter } from "@/lib/utils";

import { handleError } from "@/lib/error-handler";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ReportData {
  period: {
    start: string;
    end: string;
    type?: "custom" | "week" | "month" | "quarter" | "day" | "year";
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    totalDiscount?: number;
    totalShippingCost?: number;
    netProfit?: number;
    averageOrderValue: number;
  };
  comparison?: {
    revenueChange: number;
    ordersChange: number;
    itemsChange: number;
    prevPeriod: {
      start: string;
      end: string;
      totalRevenue: number;
      totalOrders: number;
      totalItems: number;
    };
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    category?: string;
    productId?: string;
  }>;
  categoryRevenue: Array<{
    name: string;
    value: number;
    categoryId?: string;
  }>;
  statusDistribution?: Array<{
    status: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethodDistribution?: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  topColors?: Array<{
    colorName: string;
    quantity: number;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  topSizes?: Array<{
    sizeName: string;
    quantity: number;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  dailyRevenue?: Array<{ name: string; date: string; total: number }>;
  orders?: Array<{
    id: string;
    date: string;
    total: number;
    items: number;
    status: string;
  }> | undefined;
  filters?: {
    categories: Array<{ id: string; name: string }>;
    products: Array<{ id: string; name: string }>;
    selectedCategory: string | null;
    selectedProduct: string | null;
    selectedStatus?: string | null;
    selectedPaymentMethod?: string | null;
  };
}

interface ReportsClientProps {
  data: ReportData;
}

export const ReportsClient: React.FC<ReportsClientProps> = ({ data }) => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") ||
      format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [period, setPeriod] = useState<"custom" | "week" | "month" | "quarter">(
    (searchParams.get("period") as any) || "custom"
  );
  const [categoryId, setCategoryId] = useState<string | "">(
    data.filters?.selectedCategory || ""
  );
  const [productId, setProductId] = useState<string | "">(
    data.filters?.selectedProduct || ""
  );
  const [status, setStatus] = useState<string | "">(
    data.filters?.selectedStatus || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string | "">(
    data.filters?.selectedPaymentMethod || ""
  );

  const categoryOptions = data.filters?.categories || [];
  const groupedCategories = useMemo(() => {
    const parents: Record<
      string,
      {
        id: string;
        name: string;
        children: Array<{ id: string; name: string }>;
      }
    > = {};
    const root: Array<{
      id: string;
      name: string;
      children: Array<{ id: string; name: string }>;
    }> = [];
    // Build lookup for parents
    categoryOptions.forEach((c: any) => {
      if (!c.parentId) {
        parents[c.id] = { id: c.id, name: c.name, children: [] };
      }
    });
    // Attach children to parents
    categoryOptions.forEach((c: any) => {
      if (c.parentId && parents[c.parentId]) {
        parents[c.parentId].children.push({ id: c.id, name: c.name });
      }
    });
    // Create ordered list: parent with children; include orphan children and standalone roots
    Object.values(parents).forEach((p) => root.push(p));
    return root.sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryOptions]);
  const productOptions = data.filters?.products || [];

  const categoryPie = useMemo(() => {
    return (data.categoryRevenue || []).map((c) => ({
      name: c.name,
      value: Math.round(c.value),
    }));
  }, [data.categoryRevenue]);

  const dailyLine = useMemo(() => {
    return (data.dailyRevenue || []).map((d) => ({
      name: d.name,
      total: Math.round(d.total),
    }));
  }, [data.dailyRevenue]);

  const handleDateFilter = () => {
    const urlParams = new URLSearchParams();
    urlParams.set("startDate", startDate);
    urlParams.set("endDate", endDate);
    urlParams.set("period", period);
    if (categoryId) urlParams.set("categoryId", categoryId);
    if (productId) urlParams.set("productId", productId);
    if (status) urlParams.set("status", status);
    if (paymentMethod) urlParams.set("paymentMethod", paymentMethod);
    router.push(`/${params.storeId as string}/reports?${urlParams.toString()}`);
    router.refresh();
  };

  // Order status options
  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "PROCESSING", label: "Đang xử lý" },
    { value: "SHIPPED", label: "Đã giao hàng" },
    { value: "DELIVERED", label: "Đã nhận hàng" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: "", label: "Tất cả phương thức" },
    { value: "COD", label: "Thanh toán khi nhận hàng" },
    { value: "VNPAY", label: "VNPay" },
    { value: "MOMO", label: "MoMo" },
    { value: "STRIPE", label: "Stripe" },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/${params.storeId}/reports/export?format=pdf&startDate=${startDate}&endDate=${endDate}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDate}-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, "Có lỗi xảy ra khi xuất PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/${params.storeId}/reports/export?format=excel&startDate=${startDate}&endDate=${endDate}`,
        { method: "GET" }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, "Có lỗi xảy ra khi xuất Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading
          title={t("reports.title")}
          description={t("reports.description")}
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {t("reports.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                {t("reports.exportPDF")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("reports.exportExcel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("reports.dateRangeFilter")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("reports.startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("reports.endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">{t("reports.period")}</Label>
              <select
                id="period"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
              >
                <option value="custom">{t("reports.periodCustom")}</option>
                <option value="week">{t("reports.periodWeek")}</option>
                <option value="month">{t("reports.periodMonth")}</option>
                <option value="quarter">{t("reports.periodQuarter")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t("reports.categoryFilter")}</Label>
              <select
                id="category"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">{t("reports.allCategories")}</option>
                {groupedCategories.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name}</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        • {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="product">{t("reports.productFilter")}</Label>
              <select
                id="product"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">{t("reports.allProducts")}</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái đơn hàng</Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <select
                id="paymentMethod"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {paymentMethodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleDateFilter} className="w-full">
                {t("reports.applyFilter")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.totalRevenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatter.format(data.summary.totalRevenue)}
            </div>
            {data.summary.totalDiscount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Giảm giá: {formatter.format(data.summary.totalDiscount)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.totalOrders")}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Giá trị TB: {formatter.format(data.summary.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.totalItems")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalItems}</div>
            {data.summary.totalShippingCost !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Phí vận chuyển:{" "}
                {formatter.format(data.summary.totalShippingCost)}
              </p>
            )}
          </CardContent>
        </Card>

        {data.summary.netProfit !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lợi nhuận ròng
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(data.summary.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Doanh thu - Chi phí
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison vs previous period */}
      {data.comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("reports.comparison")}
            </CardTitle>
            <CardDescription>
              {t("reports.prevPeriod")}:{" "}
              {format(new Date(data.comparison.prevPeriod.start), "dd/MM/yyyy")}{" "}
              - {format(new Date(data.comparison.prevPeriod.end), "dd/MM/yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {[
                {
                  label: t("reports.totalRevenue"),
                  value: data.summary.totalRevenue,
                  change: data.comparison.revenueChange,
                  formatFn: (v: number) => formatter.format(v),
                },
                {
                  label: t("reports.totalOrders"),
                  value: data.summary.totalOrders,
                  change: data.comparison.ordersChange,
                  formatFn: (v: number) => v.toString(),
                },
                {
                  label: t("reports.totalItems"),
                  value: data.summary.totalItems,
                  change: data.comparison.itemsChange,
                  formatFn: (v: number) => v.toString(),
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="text-xl font-semibold">
                      {m.formatFn(m.value)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      m.change >= 0 ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {m.change >= 0 ? (
                      <TrendingUp className="inline mr-1 h-4 w-4" />
                    ) : (
                      <TrendingDown className="inline mr-1 h-4 w-4" />
                    )}
                    {Math.abs(m.change).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("reports.dailyRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyLine}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => formatter.format(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t("reports.revenueByCategoryChart")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {categoryPie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#22c55e", "#06b6d4", "#a855f7", "#f59e0b", "#ef4444"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatter.format(Number(v))} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status and Payment Method Distribution */}
      {(data.statusDistribution || data.paymentMethodDistribution) && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {data.statusDistribution && data.statusDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Phân bố theo trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data.statusDistribution.map((s) => ({
                        name: s.status,
                        value: s.count,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#22c55e",
                              "#06b6d4",
                              "#a855f7",
                              "#f59e0b",
                              "#ef4444",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {data.paymentMethodDistribution &&
            data.paymentMethodDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Phân bố theo phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={data.paymentMethodDistribution.map((p) => ({
                          name: p.method,
                          value: p.count,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                      >
                        {data.paymentMethodDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#22c55e",
                                "#06b6d4",
                                "#a855f7",
                                "#f59e0b",
                                "#ef4444",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.topProducts")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.product")}</TableHead>
                <TableHead>{t("reports.quantitySold")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topProducts.map((product, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                >
                  <TableCell className="font-medium">
                    {product.productId ? (
                      <Link
                        href={`/${params.storeId}/products/${product.productId}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                      >
                        <span>{product.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      product.name
                    )}
                  </TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatter.format(product.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.revenueByCategory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.category")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categoryRevenue.map((category, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                  onClick={() => {
                    if (category.categoryId) {
                      const urlParams = new URLSearchParams();
                      urlParams.set("startDate", startDate);
                      urlParams.set("endDate", endDate);
                      urlParams.set("period", period);
                      urlParams.set("categoryId", category.categoryId);
                      if (status) urlParams.set("status", status);
                      if (paymentMethod)
                        urlParams.set("paymentMethod", paymentMethod);
                      router.push(
                        `/${params.storeId}/reports?${urlParams.toString()}`
                      );
                      router.refresh();
                    }
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 group">
                      <span>{category.name}</span>
                      {category.categoryId && (
                        <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatter.format(category.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Colors and Sizes */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Colors */}
        {data.topColors && data.topColors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Màu sắc được mua nhiều nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Màu sắc</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Tỷ lệ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topColors.map((color, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                      onClick={() => {
                        toast.info(
                          `Đang lọc báo cáo theo màu: ${color.colorName}`,
                          {
                            description: "Tính năng này sẽ được cập nhật sớm",
                          }
                        );
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 group">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor:
                                color.colorName.toLowerCase() === "đỏ"
                                  ? "#ef4444"
                                  : color.colorName.toLowerCase() === "xanh"
                                  ? "#3b82f6"
                                  : color.colorName.toLowerCase() === "vàng"
                                  ? "#fbbf24"
                                  : color.colorName.toLowerCase() === "xanh lá"
                                  ? "#22c55e"
                                  : color.colorName.toLowerCase() === "đen"
                                  ? "#000000"
                                  : color.colorName.toLowerCase() === "trắng"
                                  ? "#ffffff"
                                  : color.colorName.toLowerCase() === "hồng"
                                  ? "#ec4899"
                                  : color.colorName.toLowerCase() === "tím"
                                  ? "#a855f7"
                                  : color.colorName.toLowerCase() === "cam"
                                  ? "#f97316"
                                  : color.colorName.toLowerCase() === "nâu"
                                  ? "#92400e"
                                  : "transparent",
                            }}
                          />
                          <span>{color.colorName}</span>
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {color.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(color.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {color.percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Top Sizes */}
        {data.topSizes && data.topSizes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Kích thước được mua nhiều nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kích thước</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Tỷ lệ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topSizes.map((size, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                      onClick={() => {
                        toast.info(
                          `Đang lọc báo cáo theo kích thước: ${size.sizeName}`,
                          {
                            description: "Tính năng này sẽ được cập nhật sớm",
                          }
                        );
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 group">
                          <span>{size.sizeName}</span>
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {size.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(size.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {size.percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
