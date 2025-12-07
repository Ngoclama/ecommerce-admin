"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface ReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    averageOrderValue: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  categoryRevenue: Array<{
    name: string;
    value: number;
  }>;
  orders: Array<{
    id: string;
    date: string;
    total: number;
    items: number;
    status: string;
  }>;
}

interface ReportsClientProps {
  data: ReportData;
}

export const ReportsClient: React.FC<ReportsClientProps> = ({ data }) => {
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

  const handleDateFilter = () => {
    const urlParams = new URLSearchParams();
    urlParams.set("startDate", startDate);
    urlParams.set("endDate", endDate);
    router.push(`/${params.storeId as string}/reports?${urlParams.toString()}`);
    router.refresh();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.loading("Đang xuất báo cáo PDF...");

    try {
      const response = await fetch(
        `/api/${params.storeId}/reports/export?format=pdf&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) throw new Error("Export failed");

      const pdfData = await response.json();

      // Create PDF using jsPDF
      const doc = new jsPDF();

      // Add Vietnamese font support
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("BÁO CÁO DOANH THU CHI TIẾT", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Cửa hàng: ${pdfData.store.name}`, 20, 35);
      doc.text(
        `Thời gian: ${pdfData.period.start} - ${pdfData.period.end}`,
        20,
        42
      );
      doc.text(
        `Ngày xuất: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`,
        20,
        49
      );

      // Summary section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TỔNG QUAN", 20, 62);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryY = 70;
      doc.text(
        `Tổng doanh thu: ${formatter.format(pdfData.summary.totalRevenue)}`,
        20,
        summaryY
      );
      doc.text(
        `Tổng đơn hàng: ${pdfData.summary.totalOrders}`,
        20,
        summaryY + 7
      );
      doc.text(
        `Tổng sản phẩm bán: ${pdfData.summary.totalItems}`,
        20,
        summaryY + 14
      );
      doc.text(
        `Giá trị đơn hàng TB: ${formatter.format(
          pdfData.summary.averageOrderValue
        )}`,
        20,
        summaryY + 21
      );

      // Top Products Table
      let currentY = summaryY + 35;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOP SẢN PHẨM BÁN CHẠY", 20, currentY);

      (doc as any).autoTable({
        startY: currentY + 5,
        head: [["STT", "Sản phẩm", "Số lượng", "Doanh thu"]],
        body: pdfData.topProducts
          .slice(0, 10)
          .map((p: any, i: number) => [
            i + 1,
            p.name.substring(0, 40),
            p.quantity,
            formatter.format(p.revenue),
          ]),
        styles: { fontSize: 9, font: "helvetica" },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Category Revenue Table
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DOANH THU THEO DANH MỤC", 20, currentY);

      (doc as any).autoTable({
        startY: currentY + 5,
        head: [["STT", "Danh mục", "Doanh thu", "% Doanh thu"]],
        body: pdfData.categoryRevenue.map((c: any, i: number) => [
          i + 1,
          c.name,
          formatter.format(c.value),
          `${c.percentage}%`,
        ]),
        styles: { fontSize: 9, font: "helvetica" },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });

      // Save PDF
      doc.save(`bao-cao-${startDate}-${endDate}.pdf`);

      toast.dismiss();
      toast.success("Đã xuất báo cáo PDF thành công!");
    } catch (error) {
      toast.dismiss();
      handleError(error, "Có lỗi xảy ra khi xuất PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    toast.loading("Đang xuất báo cáo Excel...");

    try {
      const response = await fetch(
        `/api/${params.storeId}/reports/export?format=excel&startDate=${startDate}&endDate=${endDate}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success("Đã xuất báo cáo Excel thành công!");
    } catch (error) {
      toast.dismiss();
      handleError(error, "Có lỗi xảy ra khi xuất Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const glassCardEffect =
    "rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 p-8 pt-6">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <Heading
            title="📊 Báo cáo chi tiết"
            description="Phân tích doanh thu và hiệu suất kinh doanh toàn diện"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isExporting}
                className="group transition-all duration-300 hover:scale-105 shadow-sm"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                )}
                Xuất báo cáo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleExportPDF}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                <span>Xuất PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
                <span>Xuất Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <Separator />

      {/* Date Range Filter */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className={glassCardEffect}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Bộ lọc thời gian
            </CardTitle>
            <CardDescription>
              Chọn khoảng thời gian để xem báo cáo chi tiết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="startDate">Từ ngày</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="endDate">Đến ngày</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleDateFilter}
                className="w-full md:w-auto transition-all duration-300 hover:scale-105"
              >
                <Activity className="mr-2 h-4 w-4" />
                Áp dụng bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng doanh thu
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-12 w-12 rounded-xl bg-linear-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/20 flex items-center justify-center shadow-sm"
              >
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatter.format(data.summary.totalRevenue)}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>Doanh thu trong kỳ</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng đơn hàng
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center shadow-sm"
              >
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {data.summary.totalOrders}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đơn hàng đã thanh toán
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sản phẩm đã bán
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-12 w-12 rounded-xl bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center shadow-sm"
              >
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {data.summary.totalItems}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tổng số lượng sản phẩm
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className={glassCardEffect}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Giá trị TB/đơn
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-12 w-12 rounded-xl bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center shadow-sm"
              >
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatter.format(data.summary.averageOrderValue)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Average order value
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className={glassCardEffect}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Sản phẩm bán chạy
            </CardTitle>
            <CardDescription>
              Danh sách sản phẩm có doanh thu cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-900/50">
                    <TableHead className="font-semibold">STT</TableHead>
                    <TableHead className="font-semibold">Sản phẩm</TableHead>
                    <TableHead className="text-right font-semibold">
                      Số lượng bán
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Doanh thu
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((product, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                    >
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                        {formatter.format(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Revenue */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className={glassCardEffect}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Doanh thu theo danh mục
            </CardTitle>
            <CardDescription>
              Phân tích doanh thu chi tiết theo từng danh mục sản phẩm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-900/50">
                    <TableHead className="font-semibold">STT</TableHead>
                    <TableHead className="font-semibold">Danh mục</TableHead>
                    <TableHead className="text-right font-semibold">
                      Doanh thu
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categoryRevenue.map((category, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                    >
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatter.format(category.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
