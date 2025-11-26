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
  Store as StoreIcon,
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
    name: string;
    price: number;
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
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalPrice: number; // Legacy field
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
  // Use React Query for caching
  const { data, isLoading: loading, error } = useOrder(storeId, orderId);
  const order = (data?.order as OrderDetails) || null;
  const store = (data?.store as StoreInfo) || null;

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch details.");
      onClose();
    }
  }, [error, onClose]);

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

  const onPrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-neutral-900 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* HEADER MODAL (Ẩn khi in) */}
        <DialogHeader className="flex flex-row items-center justify-between print:hidden">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5" />
              {t("modals.orderDetails")}
            </DialogTitle>
            <DialogDescription>
              {t("nav.orders")}{" "}
              <span className="font-mono font-bold">
                #{order?.id.slice(-6)}
              </span>
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 mr-8">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t("modals.printInvoice")}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : order ? (
          <ScrollArea className="flex-1 pr-4 -mr-4 print:pr-0 print:mr-0">
            <div className="space-y-8 p-1 print:space-y-4">
              <div className="hidden print:block border-b pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">
                      {store?.name || "Store Name"}
                    </h1>
                    {store?.address && (
                      <div className="flex items-center gap-2 text-sm mt-2 text-gray-600">
                        <MapPin className="h-3 w-3" /> {store.address}
                      </div>
                    )}
                    <div className="flex gap-4 mt-1">
                      {store?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" /> {store.phone}
                        </div>
                      )}
                      {store?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" /> {store.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">
                      {t("modals.invoice")}
                    </h2>
                    <p className="text-sm text-gray-500">
                      #{order.id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    <User className="h-4 w-4" /> {t("modals.customerInfo")}
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm border border-neutral-100 dark:border-neutral-800 print:border-gray-300 print:bg-white print:p-2">
                    <div className="font-semibold mb-1">
                      {t("modals.contact")}
                    </div>
                    <div>{order.phone || t("modals.noPhone")}</div>
                    {order.email && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.email}
                      </div>
                    )}
                    <div className="font-semibold mt-2 mb-1">
                      {t("columns.address")}:
                    </div>
                    <div>
                      {order.address || t("modals.noAddress")}
                      {order.city && `, ${order.city}`}
                      {order.postalCode && ` ${order.postalCode}`}
                      {order.country && `, ${order.country}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    <CreditCard className="h-4 w-4" /> {t("modals.paymentInfo")}
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm border border-neutral-100 dark:border-neutral-800 print:border-gray-300 print:bg-white print:p-2">
                    <div className="flex justify-between mb-2">
                      <span>{t("modals.paymentStatus")}</span>
                      <Badge variant={order.isPaid ? "default" : "destructive"}>
                        {order.isPaid ? t("columns.paid") : t("modals.unpaid")}
                      </Badge>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>{t("modals.orderStatus")}</span>
                      <Badge variant="outline" className="uppercase">
                        {order.status || "PENDING"}
                      </Badge>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex justify-between mb-2 text-xs">
                        <span>{t("columns.tracking")}:</span>
                        <span className="font-mono">
                          {order.trackingNumber}
                        </span>
                      </div>
                    )}
                    {order.shippingMethod && (
                      <div className="flex justify-between mb-2 text-xs">
                        <span>{t("nav.shipping")}:</span>
                        <span>{order.shippingMethod}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>{t("columns.total")}:</span>
                      <span>
                        {formatter.format(order.total || order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              {(order.subtotal > 0 || order.tax > 0 || order.discount > 0) && (
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border print:bg-white print:border-gray-300">
                  <h3 className="text-sm font-semibold mb-3">
                    {t("modals.orderSummary")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t("modals.subtotal")}</span>
                      <span>
                        {formatter.format(order.subtotal || order.totalPrice)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("columns.discount")}:</span>
                        <span>-{formatter.format(order.discount)}</span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="flex justify-between">
                        <span>{t("modals.tax")}</span>
                        <span>{formatter.format(order.tax)}</span>
                      </div>
                    )}
                    {order.shippingCost && order.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>{t("nav.shipping")}:</span>
                        <span>{formatter.format(order.shippingCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{t("columns.total")}:</span>
                      <span>
                        {formatter.format(order.total || order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(order.customerNote || order.adminNote) && (
                <div className="space-y-2">
                  {order.customerNote && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        {t("modals.customerNote")}
                      </div>
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        {order.customerNote}
                      </div>
                    </div>
                  )}
                  {order.adminNote && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">
                        {t("modals.adminNote")}
                      </div>
                      <div className="text-sm text-orange-900 dark:text-orange-100">
                        {order.adminNote}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator className="print:hidden" />

              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4 print:mb-2">
                  {t("modals.orderItems")}
                </h3>
                <div className="border rounded-xl overflow-hidden print:border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 dark:bg-neutral-800/50 print:bg-gray-100">
                        <TableHead className="print:text-black">
                          {t("columns.products")}
                        </TableHead>
                        <TableHead className="print:text-black">
                          {t("modals.variant")}
                        </TableHead>
                        <TableHead className="text-center print:text-black">
                          {t("modals.qty")}
                        </TableHead>
                        <TableHead className="text-right print:text-black">
                          {t("columns.price")}
                        </TableHead>
                        <TableHead className="text-right print:text-black">
                          {t("columns.total")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.productName || item.product?.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 text-xs">
                              {item.sizeName && (
                                <Badge variant="outline" className="text-xs">
                                  {t("columns.size")}: {item.sizeName}
                                </Badge>
                              )}
                              {item.colorName && (
                                <Badge variant="outline" className="text-xs">
                                  {t("columns.color")}: {item.colorName}
                                </Badge>
                              )}
                              {item.materialName && (
                                <Badge variant="outline" className="text-xs">
                                  {t("columns.material")}: {item.materialName}
                                </Badge>
                              )}
                              {!item.sizeName &&
                                !item.colorName &&
                                !item.materialName && (
                                  <span className="text-muted-foreground">
                                    {t("columns.na")}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatter.format(
                              item.price ||
                                item.productPrice ||
                                item.product?.price ||
                                0
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatter.format(
                              (item.price ||
                                item.productPrice ||
                                item.product?.price ||
                                0) * item.quantity
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Footer in hóa đơn */}
              <div className="hidden print:block text-center text-sm text-gray-500 mt-10 pt-10 border-t">
                <p>{t("modals.thankYou")}</p>
                <p>
                  {store?.name} - {store?.phone}
                </p>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-10 text-center text-neutral-500">
            {t("modals.orderNotFound")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
