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
  Calendar,
  Package,
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
import { Label } from "@/components/ui/label";
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
  productName: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  productPrice: number;
};

type OrderDetails = {
  id: string;
  status?: string;
  isPaid: boolean;
  phone: string;
  address: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
};

export const OrderViewModal: React.FC<OrderViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  orderId,
}) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isOpen || !orderId) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/${storeId}/orders/${orderId}`);
        if ("data" in response && typeof response.data === "object") {
          setOrder(response.data as OrderDetails);
        }
      } catch (error) {
        toast.error("Failed to fetch order details.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [isOpen, orderId, storeId, onClose]);

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5" />
            Order Details
          </DialogTitle>
          <DialogDescription>
            View information regarding order
            <span className="font-mono font-bold text-neutral-600 dark:text-neutral-400">
              : {order?.id}
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : order ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                    <Calendar className="h-4 w-4" /> Created At
                  </div>
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm">
                    {formatDate(order.createdAt)}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                    <Package className="h-4 w-4" /> Status
                  </div>
                  <div>
                    <Badge
                      variant={
                        order.status === "DELIVERED" ? "default" : "secondary"
                      }
                    >
                      {order.status || "Unknown"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                    <CreditCard className="h-4 w-4" /> Payment Status
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.isPaid ? "default" : "destructive"}>
                      {order.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                    <span className="text-sm font-medium">
                      Total: {formatter.format(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                    <Phone className="h-4 w-4" /> Phone
                  </div>
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm break-words">
                    {order.phone || "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                    <MapPin className="h-4 w-4" /> Address
                  </div>
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm break-words">
                    {order.address || "N/A"}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-4">
                  Order Items ({order.orderItems.length})
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 dark:bg-neutral-800/50">
                        <TableHead>Product</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.sizeName}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.colorName}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatter.format(item.productPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
