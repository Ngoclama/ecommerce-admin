"use client";

import { useEffect, useState } from "react";
import axios from "axios";
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
  quantity: number;
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
  address: string;
  totalPrice: number;
  createdAt: string;
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
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !orderId) return;

      try {
        setLoading(true);

        const [orderRes, storeRes] = await Promise.all([
          axios.get<OrderDetails>(`/api/${storeId}/orders/${orderId}`),
          axios.get<StoreInfo>(`/api/stores/${storeId}`),
        ]);

        setOrder(orderRes.data);
        setStore(storeRes.data);
      } catch (error) {
        toast.error("Failed to fetch details.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, orderId, storeId, onClose]);

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
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order{" "}
              <span className="font-mono font-bold">
                #{order?.id.slice(-6)}
              </span>
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 mr-8">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
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
                    <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
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
                    <User className="h-4 w-4" /> Customer Info
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm border border-neutral-100 dark:border-neutral-800 print:border-gray-300 print:bg-white print:p-2">
                    <div className="font-semibold mb-1">Contact:</div>
                    <div>{order.phone || "No phone"}</div>
                    <div className="font-semibold mt-2 mb-1">Address:</div>
                    <div>{order.address || "No address"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    <CreditCard className="h-4 w-4" /> Payment Info
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm border border-neutral-100 dark:border-neutral-800 print:border-gray-300 print:bg-white print:p-2">
                    <div className="flex justify-between mb-2">
                      <span>Status:</span>
                      <span className="font-bold uppercase">
                        {order.isPaid ? "PAID" : "UNPAID"}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatter.format(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="print:hidden" />

              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4 print:mb-2">
                  Order Items
                </h3>
                <div className="border rounded-xl overflow-hidden print:border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 dark:bg-neutral-800/50 print:bg-gray-100">
                        <TableHead className="print:text-black">
                          Product
                        </TableHead>
                        <TableHead className="print:text-black">
                          Variant
                        </TableHead>
                        <TableHead className="text-center print:text-black">
                          Qty
                        </TableHead>
                        <TableHead className="text-right print:text-black">
                          Price
                        </TableHead>
                        <TableHead className="text-right print:text-black">
                          Total
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
                            {item.sizeName && (
                              <span className="mr-2">{item.sizeName}</span>
                            )}
                            {item.colorName && <span>{item.colorName}</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatter.format(
                              item.productPrice || item.product?.price || 0
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatter.format(
                              (item.productPrice || item.product?.price || 0) *
                                item.quantity
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
                <p>Thank you for your business!</p>
                <p>
                  {store?.name} - {store?.phone}
                </p>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-10 text-center text-neutral-500">
            Order not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
