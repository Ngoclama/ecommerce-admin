"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface CouponViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  couponId: string;
}

export const CouponViewModal: React.FC<CouponViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  couponId,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !couponId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/${storeId}/coupons/${couponId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error loading Coupon:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, storeId, couponId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-50 w-11/12 max-w-lg rounded-2xl bg-white/90 dark:bg-neutral-900/90 
                       border border-neutral-200 dark:border-neutral-800 backdrop-blur-lg 
                       shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                Coupon Details
              </h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-neutral-500">
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Loading...
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-500">ID:</p>
                  <p className="text-base font-mono break-all">{data.id}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Code:</p>
                  <p className="text-base font-medium">{data.code}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Discount:</p>
                  <p className="text-base font-medium">
                    {data.type === 'PERCENT' 
                      ? `${data.value}%` 
                      : `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.value)}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Type:</p>
                  <p className="text-base font-medium">{data.type === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Created At:</p>
                  <p className="text-base">
                    {new Date(data.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-neutral-500">No data found.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
