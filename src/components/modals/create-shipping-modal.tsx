"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Truck } from "lucide-react";
import { useCreateShippingModal } from "@/hooks/use-create-shipping-modal";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export const CreateShippingModal = () => {
  const { isOpen, onClose, orderId, orderData } = useCreateShippingModal();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider: "CUSTOM",
    shippingMethod: "Standard",
    weight: "1000",
    toCity: "",
    toDistrict: "",
    toWard: "",
  });

  useEffect(() => {
    if (orderData) {
      setFormData({
        provider: "CUSTOM",
        shippingMethod: "Standard",
        weight: "1000",
        toCity: orderData.city || "",
        toDistrict: "",
        toWard: "",
      });
    }
  }, [orderData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`/api/${params.storeId}/shipping`, {
        orderId,
        provider: formData.provider,
        shippingMethod: formData.shippingMethod,
        toAddress: orderData?.address || "",
        toPhone: orderData?.phone || "",
        toName: orderData?.user?.name || "Customer",
        toCity: formData.toCity,
        toDistrict: formData.toDistrict,
        toWard: formData.toWard,
        weight: parseInt(formData.weight),
        codAmount: orderData?.total || 0,
      });
      toast.success("Shipping order created successfully!");
      router.refresh();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create shipping order"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Create Shipping Order
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Shipping Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                    <SelectItem value="GHN">Giao Hàng Nhanh (GHN)</SelectItem>
                    <SelectItem value="VIETTELPOST">Viettel Post</SelectItem>
                    <SelectItem value="GHTK">Giao Hàng Tiết Kiệm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Shipping Method</Label>
                <Input
                  id="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, shippingMethod: e.target.value })
                  }
                  placeholder="Standard"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toCity">City</Label>
                  <Input
                    id="toCity"
                    value={formData.toCity}
                    onChange={(e) =>
                      setFormData({ ...formData, toCity: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDistrict">District</Label>
                  <Input
                    id="toDistrict"
                    value={formData.toDistrict}
                    onChange={(e) =>
                      setFormData({ ...formData, toDistrict: e.target.value })
                    }
                    placeholder="District"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toWard">Ward</Label>
                  <Input
                    id="toWard"
                    value={formData.toWard}
                    onChange={(e) =>
                      setFormData({ ...formData, toWard: e.target.value })
                    }
                    placeholder="Ward"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Shipping"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
