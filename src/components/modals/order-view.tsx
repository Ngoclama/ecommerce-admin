"use client";

import { useEffect } from "react";
import { useOrder } from "@/hooks/use-api-cache";
import { toast } from "sonner";
import {
  Loader2,
  ShoppingBag,
  CreditCard,
  MapPin,
  Phone,
  Package,
  User,
  Printer,
  Mail,
  Calendar,
  Clock,
  Hash,
  Truck,
  Receipt,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface OrderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  orderId: string;
}

type OrderItem = {
  id: string;
  productName: string | null;
  sizeName: string | null;
  colorName: string | null;
  materialName: string | null;
  quantity: number;
  price: number;
  productPrice: number | null;
  product?: {
    id: string;
    name: string;
    price: number;
    images?: Array<{
      url: string;
    }>;
  };
};

type OrderDetails = {
  id: string;
  status: string;
  isPaid: boolean;
  phone: string;
  email: string | null;
  address: string;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  shippingMethod: string | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalPrice: number;
  customerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
};

type StoreInfo = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

export const OrderViewModal: React.FC<OrderViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  orderId,
}) => {
  const { t } = useTranslation();
  const { data, isLoading: loading, error } = useOrder(storeId, orderId);
  const order = (data?.order as OrderDetails) || null;
  const store = (data?.store as StoreInfo) || null;

  useEffect(() => {
    if (error) {
      toast.error(t("modals.failedToFetch"));
      onClose();
    }
  }, [error, onClose, t]);

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return t("actions.pending");
      case "PROCESSING":
        return t("actions.processingStatus");
      case "SHIPPED":
        return t("actions.shipped");
      case "DELIVERED":
        return t("actions.delivered");
      case "CANCELLED":
        return t("actions.cancelled");
      default:
        return status || t("actions.pending");
    }
  };

  const onPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none! w-screen! h-screen! m-0! rounded-none! inset-0! translate-x-0! translate-y-0!">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("modals.orderDetails")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none! w-screen! h-screen! m-0! rounded-none! flex flex-col overflow-hidden bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible p-0 gap-0 inset-0! translate-x-0! translate-y-0!">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("modals.orderDetails")}</DialogTitle>
          <DialogDescription>
            {t("nav.orders")} #{order?.id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Modern Header */}
        <div className="relative bg-linear-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b border-gray-200 dark:border-gray-800 px-8 py-5 print:hidden shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {t("modals.orderDetails")}
                </h2>
                <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  <span className="font-mono font-semibold text-primary">
                    #{order?.id.slice(-8).toUpperCase()}
                  </span>
                  {order && <span>• {formatDate(order.createdAt)}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                {t("modals.printInvoice")}
              </Button>
            </div>
          </div>
        </div>

        {!order ? (
          <div className="flex items-center justify-center py-20 flex-1">
            <div className="text-center space-y-3">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">{t("modals.orderNotFound")}</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-8 py-6 min-h-0">
            <div className="space-y-6 w-full">
              {}
              <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl border font-semibold",
                        getStatusColor(order.status)
                      )}
                    >
                      {order.status === "DELIVERED" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {order.status === "CANCELLED" && (
                        <XCircle className="h-4 w-4" />
                      )}
                      {(order.status === "PENDING" ||
                        order.status === "PROCESSING") && (
                        <Clock className="h-4 w-4" />
                      )}
                      {getStatusText(order.status)}
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold",
                        order.isPaid
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
                      )}
                    >
                      {order.isPaid ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {order.isPaid ? t("columns.paid") : t("modals.unpaid")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      {t("modals.totalAmount")}
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatter.format(order.total || order.totalPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {}
                <div className="xl:col-span-1 space-y-4">
                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {t("modals.customerInfo")}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                          {t("modals.contact")}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {order.phone || t("modals.noPhone")}
                        </div>
                        {order.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                            <Mail className="h-4 w-4" />
                            {order.email}
                          </div>
                        )}
                      </div>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                          {t("columns.address")}
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="leading-relaxed">
                            {order.address || t("modals.noAddress")}
                            {order.city && `, ${order.city}`}
                            {order.postalCode && ` ${order.postalCode}`}
                            {order.country && `, ${order.country}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment & Shipping Cards */}
                <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                  {}
                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {t("modals.paymentInfo")}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {order.paymentMethod && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            {t("modals.paymentMethod")}
                          </div>
                          <div className="text-sm font-medium">
                            {order.paymentMethod}
                          </div>
                        </div>
                      )}
                      {order.transactionId && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            {t("modals.transactionId")}
                          </div>
                          <div className="text-xs font-mono break-all bg-muted px-2 py-1.5 rounded-md">
                            {order.transactionId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {t("modals.shipping")}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {order.shippingMethod && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            {t("modals.shippingMethod")}
                          </div>
                          <div className="text-sm font-medium">
                            {order.shippingMethod}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">
                          {t("modals.shippingFee")}
                        </div>
                        <div className="text-sm font-medium">
                          {order.shippingCost === 0
                            ? t("modals.free")
                            : order.shippingCost !== null
                            ? formatter.format(order.shippingCost)
                            : t("columns.na")}
                        </div>
                      </div>
                      {order.trackingNumber && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            {t("columns.tracking")}
                          </div>
                          <div className="text-xs font-mono break-all bg-muted px-2 py-1.5 rounded-md">
                            {order.trackingNumber}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("modals.orderSummary")}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">
                        {t("modals.subtotal")}
                      </span>
                      <span className="font-semibold">
                        {formatter.format(order.subtotal || order.totalPrice)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between items-center py-2 text-green-600 dark:text-green-400">
                        <span className="text-sm">{t("modals.discount")}</span>
                        <span className="font-semibold">
                          -{formatter.format(order.discount)}
                        </span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">
                          {t("modals.tax")}
                        </span>
                        <span className="font-semibold">
                          {formatter.format(order.tax)}
                        </span>
                      </div>
                    )}
                    {order.shippingCost !== null && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">
                          {t("nav.shipping")}
                        </span>
                        <span className="font-semibold">
                          {order.shippingCost === 0
                            ? t("modals.free")
                            : formatter.format(order.shippingCost)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-base font-semibold">
                        {t("columns.total")}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {formatter.format(order.total || order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("modals.orderInformation")}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        {t("modals.orderCode")}
                      </div>
                      <span className="text-xs font-mono">{order.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {t("modals.createdAt")}
                      </div>
                      <span className="text-sm">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {t("modals.updated")}
                        </div>
                        <span className="text-sm">
                          {formatDate(order.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {}
              {(order.customerNote || order.adminNote) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {order.customerNote && (
                    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          {t("modals.customerNote")}
                        </h4>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        {order.customerNote}
                      </p>
                    </div>
                  )}
                  {order.adminNote && (
                    <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                          {t("modals.adminNote")}
                        </h4>
                      </div>
                      <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                        {order.adminNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-linear-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("modals.orderItems")}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({order.orderItems.length} {t("modals.products")})
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[400px]">
                          {t("modals.product")}
                        </TableHead>
                        <TableHead className="min-w-[280px]">
                          {t("modals.variant")}
                        </TableHead>
                        <TableHead className="text-center min-w-[120px]">
                          {t("modals.qty")}
                        </TableHead>
                        <TableHead className="text-right min-w-[160px]">
                          {t("modals.unitPrice")}
                        </TableHead>
                        <TableHead className="text-right min-w-[160px]">
                          {t("columns.total")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.orderItems.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            idx !== order.orderItems.length - 1 && "border-b"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-4">
                              {item.product?.images &&
                                item.product.images[0]?.url && (
                                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0">
                                    <img
                                      src={item.product.images[0].url}
                                      alt={
                                        item.productName ||
                                        item.product?.name ||
                                        t("modals.product")
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base mb-1.5">
                                  {item.productName || item.product?.name}
                                </div>
                                {item.product?.id && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {t("modals.productId")}:{" "}
                                    {item.product.id.slice(-8)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizeName && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300"
                                >
                                  {t("modals.size")}: {item.sizeName}
                                </Badge>
                              )}
                              {item.colorName && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300"
                                >
                                  {t("modals.color")}: {item.colorName}
                                </Badge>
                              )}
                              {item.materialName && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300"
                                >
                                  {t("modals.material")}: {item.materialName}
                                </Badge>
                              )}
                              {!item.sizeName &&
                                !item.colorName &&
                                !item.materialName && (
                                  <span className="text-xs text-muted-foreground">
                                    {t("columns.na")}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted font-semibold text-sm">
                              {item.quantity}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold">
                              {formatter.format(
                                item.productPrice ||
                                  item.price ||
                                  item.product?.price ||
                                  0
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-bold text-primary">
                              {formatter.format(
                                (item.productPrice ||
                                  item.price ||
                                  item.product?.price ||
                                  0) * item.quantity
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {}
              <div className="hidden print:block text-center text-sm text-muted-foreground mt-10 pt-10 border-t">
                <p className="font-medium">{t("modals.thankYou")}</p>
                <p className="mt-2">
                  {store?.name} - {store?.phone}
                </p>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
