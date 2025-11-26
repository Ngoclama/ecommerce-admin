"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useProduct } from "@/hooks/use-api-cache";
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
import { useTranslation } from "@/hooks/use-translation";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  storeId: string;
}

interface ProductVariant {
  id: string;
  size: { name: string; value: string };
  color: { name: string; value: string };
  material: { name: string } | null;
  sku: string | null;
  inventory: number;
  lowStockThreshold: number;
  price: number | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  isFeatured: boolean;
  isArchived: boolean;
  isPublished: boolean;
  gender: string;
  category: { name: string };
  material: { name: string } | null; // Fallback material
  variants: ProductVariant[];
  images: { url: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  trackQuantity: boolean;
  allowBackorder: boolean;
  createdAt: string;
  publishedAt: string | null;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  productId,
  storeId,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  // Use React Query for caching
  const { data, isLoading, error } = useProduct(storeId, productId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>{t("modals.productDetails")}</DialogTitle>
            <DialogDescription>
              {t("modals.productDescription")}
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
                    {t("modals.images")}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {data.images.map((img: { url: string }, idx: number) => (
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

                {/* Price & Status Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("columns.price")}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-primary">
                        {formatter.format(data.price)}
                      </p>
                      {data.compareAtPrice &&
                        data.compareAtPrice > data.price && (
                          <p className="text-xs line-through text-muted-foreground">
                            {formatter.format(data.compareAtPrice)}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("modals.status")}
                    </p>
                    <div className="flex items-center gap-2">
                      {data.isPublished ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          {t("columns.published")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          {t("columns.draft")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Inventory from Variants */}
                {data.variants && data.variants.length > 0 && (
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("columns.inventory")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-mono font-medium">
                        {data.variants.reduce(
                          (sum: number, v: any) => sum + v.inventory,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{data.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    Slug: {data.slug}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {data.isFeatured && (
                    <Badge variant="default">{t("columns.featured")}</Badge>
                  )}
                  {data.isArchived && (
                    <Badge variant="destructive">{t("columns.archived")}</Badge>
                  )}
                  {!data.isArchived && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      {t("columns.active")}
                    </Badge>
                  )}
                  {data.trackQuantity && (
                    <Badge variant="outline" className="text-blue-600">
                      {t("modals.trackQuantity")}
                    </Badge>
                  )}
                  {data.allowBackorder && (
                    <Badge variant="outline" className="text-orange-600">
                      {t("modals.allowBackorder")}
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Attributes */}
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {/* Name */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> {t("columns.name")}
                    </div>
                    <span className="font-medium">{data.name}</span>
                  </div>
                  {/* Category */}

                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> {t("columns.category")}
                    </div>
                    <span className="font-medium">{data.category?.name}</span>
                  </div>

                  {/* Fallback Material */}
                  {data.material && (
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" /> {t("columns.material")}
                      </div>
                      <span className="font-medium">{data.material.name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {data.tags && data.tags.length > 0 && (
                    <div className="flex items-start justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" /> {t("modals.tags")}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.tags.map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEO Fields */}
                  {data.metaTitle && (
                    <div className="flex items-start justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" /> {t("modals.metaTitle")}
                      </div>
                      <span className="font-medium text-xs text-right max-w-[60%]">
                        {data.metaTitle}
                      </span>
                    </div>
                  )}

                  {/* Gender */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" /> {t("columns.gender")}
                    </div>
                    <span className="font-medium uppercase">
                      {data.gender || "UNISEX"}
                    </span>
                  </div>
                </div>

                {/* Description (Rich Text Display) */}
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    {t("modals.description")}
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md min-h-[80px] quill-view-content">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: data.description || t("modals.noDataFound"),
                      }}
                    />
                  </div>
                </div>

                {/* Variants Section */}
                {data.variants && data.variants.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">
                      {t("columns.products")} {t("modals.variant")}
                    </h3>
                    <div className="space-y-2">
                      {data.variants.map((variant: any, idx: number) => (
                        <div
                          key={variant.id || idx}
                          className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                {t("columns.size")}:{" "}
                              </span>
                              <span className="font-medium">
                                {variant.size.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {t("columns.color")}:{" "}
                              </span>
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: variant.color.value }}
                              />
                              <span className="font-medium">
                                {variant.color.name}
                              </span>
                            </div>
                            {variant.material && (
                              <div>
                                <span className="text-muted-foreground">
                                  {t("columns.material")}:{" "}
                                </span>
                                <span className="font-medium">
                                  {variant.material.name}
                                </span>
                              </div>
                            )}
                            {variant.sku && (
                              <div>
                                <span className="text-muted-foreground">
                                  {t("modals.sku")}:{" "}
                                </span>
                                <span className="font-mono font-medium">
                                  {variant.sku}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">
                                Stock:{" "}
                              </span>
                              <span
                                className={`font-medium ${
                                  variant.inventory <= variant.lowStockThreshold
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {variant.inventory}
                              </span>
                              {variant.inventory <=
                                variant.lowStockThreshold && (
                                <span className="text-xs text-orange-600 ml-1">
                                  ({t("modals.lowStockThreshold")})
                                </span>
                              )}
                            </div>
                            {variant.price && (
                              <div>
                                <span className="text-muted-foreground">
                                  {t("columns.price")}:{" "}
                                </span>
                                <span className="font-medium">
                                  {formatter.format(variant.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-8 pt-4 border-t">
              <Calendar className="h-3 w-3" />
              {t("modals.created")}{" "}
              {data.createdAt
                ? format(new Date(data.createdAt), "PPP")
                : t("columns.na")}
              <span className="ml-auto font-mono">ID: {data.id}</span>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            {t("modals.noDataFound")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
