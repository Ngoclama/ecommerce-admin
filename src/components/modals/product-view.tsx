"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  productId: string;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  productId,
}) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      fetch(`/api/${storeId}/products/${productId}`)
        .then((res) => res.json())
        .then((data) => setProduct(data))
        .catch((err) => {
          console.error("[ProductViewModal]", err);
          setProduct(null);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, storeId, productId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden bg-white/80 dark:bg-neutral-900/70 
                   backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-center text-neutral-800 dark:text-white">
            {loading
              ? "Loading product..."
              : product
              ? product.name
              : "Product not found"}
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-4 opacity-60" />

        {!loading && product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
            {/* Left — Images */}
            <div className="flex flex-col gap-3">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={
                    product.images?.[0]?.url ||
                    "https://placehold.co/600x600?text=No+Image"
                  }
                  alt={product.name}
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {product.images?.slice(1).map((img: any, index: number) => (
                  <div
                    key={index}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 flex-shrink-0"
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name}-${index}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Info */}
            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(product.price)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Category:</strong> {product.category?.name || "—"}
                </p>
                <p>
                  <strong>Size:</strong> {product.size?.name || "—"}
                </p>
                <p>
                  <strong>Color:</strong> {product.color?.name || "—"}
                </p>
                {/* ─── CÁC TRƯỜNG MỚI THÊM ─── */}
                <p>
                  <strong>Material:</strong> {product.material?.name || "—"}
                </p>
                <p>
                  <strong>Gender:</strong> {product.gender || "Unisex"}
                </p>
                <p>
                  <strong>Inventory:</strong> {product.inventory ?? 0}
                </p>
                {/* ─────────────────────────── */}
                <p>
                  <strong>Status:</strong>{" "}
                  {product.isArchived ? (
                    <span className="text-red-500 font-medium">Archived</span>
                  ) : product.isFeatured ? (
                    <span className="text-green-500 font-medium">Featured</span>
                  ) : (
                    <span className="text-neutral-500">Normal</span>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center text-neutral-500 py-10">
              No product data available.
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};
