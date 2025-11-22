"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Calendar,
  Package,
  Tag,
  Layers,
  Ruler,
  Palette,
  User, // Thêm icon User cho Gender
} from "lucide-react";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  storeId: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  description: string;
  isFeatured: boolean;
  isArchived: boolean;
  gender: string;
  category: { name: string };
  size: { name: string; value: string };
  color: { name: string; value: string };
  material: { name: string } | null;
  images: { url: string }[];
  createdAt: string;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  productId,
  storeId,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Product | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId || !isOpen) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/${storeId}/products/${productId}`
        );
        if (response.data) {
          setData(response.data as Product);
        }
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, storeId, isOpen]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about this product.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Gallery */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Images
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {data.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-md overflow-hidden border bg-gray-100"
                      >
                        <Image
                          src={img.url}
                          fill
                          alt="Product"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price & Inventory Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                    <p className="text-lg font-bold text-primary">
                      {formatter.format(data.price)}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Inventory
                    </p>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-mono font-medium">
                        {data.inventory}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{data.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    Slug: {data.slug}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2">
                  {data.isFeatured && <Badge variant="default">Featured</Badge>}
                  {data.isArchived && (
                    <Badge variant="destructive">Archived</Badge>
                  )}
                  {!data.isArchived && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      Active
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Attributes */}
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {/* Name */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> Name
                    </div>
                    <span className="font-medium">{data.name}</span>
                  </div>
                  {/* Category */}

                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> Category
                    </div>
                    <span className="font-medium">{data.category?.name}</span>
                  </div>

                  {/* Size */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="h-4 w-4" /> Size
                    </div>
                    <span className="font-medium">
                      {data.size?.name} ({data.size?.value})
                    </span>
                  </div>

                  {/* Color */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Palette className="h-4 w-4" /> Color
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: data.color?.value }}
                      />
                      <span className="font-medium">{data.color?.name}</span>
                    </div>
                  </div>

                  {/* Material (MỚI) */}
                  {data.material && (
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" /> Material
                      </div>
                      <span className="font-medium">{data.material.name}</span>
                    </div>
                  )}

                  {/* Gender (MỚI) */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" /> Gender
                    </div>
                    <span className="font-medium uppercase">
                      {data.gender || "UNISEX"}
                    </span>
                  </div>
                </div>

                {/* Description (Rich Text Display) */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md min-h-[80px] quill-view-content">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: data.description || "No description provided.",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-8 pt-4 border-t">
              <Calendar className="h-3 w-3" />
              Created:{" "}
              {data.createdAt ? format(new Date(data.createdAt), "PPP") : "N/A"}
              <span className="ml-auto font-mono">ID: {data.id}</span>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            No data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
