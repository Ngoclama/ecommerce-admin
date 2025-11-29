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
  category: {
    name: string;
    parent?: { name: string; slug: string } | null;
  };
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
                    <div className="flex items-center gap-2">
                      {data.category?.parent && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {data.category.parent.name}
                          </span>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <span className="font-medium">
                        {data.category?.name || t("columns.na")}
                      </span>
                    </div>
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
                      {t("forms.product.variants")} ({data.variants.length})
                    </h3>
                    <div className="space-y-3">
                      {data.variants.map((variant: any, idx: number) => (
                        <div
                          key={variant.id || idx}
                          className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {/* Size & Color */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">
                                  {t("columns.size")}:
                                </span>
                                <div className="flex items-center gap-1">
                                  {variant.size?.name && (
                                    <span className="font-medium">
                                      {variant.size.name}
                                    </span>
                                  )}
                                  {variant.size?.value && (
                                    <>
                                      {variant.size?.name && (
                                        <span className="text-muted-foreground">
                                          (
                                        </span>
                                      )}
                                      <span className="font-mono text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                                        {variant.size.value}
                                      </span>
                                      {variant.size?.name && (
                                        <span className="text-muted-foreground">
                                          )
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {!variant.size?.name &&
                                    !variant.size?.value && (
                                      <span className="font-medium text-muted-foreground">
                                        {t("columns.na")}
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">
                                  {t("columns.color")}:
                                </span>
                                {variant.color?.value && (
                                  <div
                                    className="h-4 w-4 rounded-full border-2 border-neutral-300"
                                    style={{
                                      backgroundColor: variant.color.value,
                                    }}
                                  />
                                )}
                                <span className="font-medium">
                                  {variant.color?.name || t("columns.na")}
                                </span>
                              </div>
                            </div>

                            {/* Material & SKU */}
                            <div className="space-y-2">
                              {variant.material && (
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">
                                    {t("columns.material")}:
                                  </span>
                                  <span className="font-medium">
                                    {variant.material.name}
                                  </span>
                                </div>
                              )}
                              {variant.sku && (
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">
                                    {t("modals.sku")}:
                                  </span>
                                  <span className="font-mono font-medium text-xs">
                                    {variant.sku}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Inventory & Price */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">
                                  {t("columns.inventory")}:
                                </span>
                                <span
                                  className={`font-medium ${
                                    variant.inventory <=
                                    variant.lowStockThreshold
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {variant.inventory}
                                </span>
                                {variant.inventory <=
                                  variant.lowStockThreshold && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-orange-600 border-orange-600"
                                  >
                                    {t("modals.lowStockThreshold")}:{" "}
                                    {variant.lowStockThreshold}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">
                                  {t("columns.price")}:
                                </span>
                                <span className="font-bold text-primary">
                                  {variant.price
                                    ? formatter.format(variant.price)
                                    : formatter.format(data.price)}
                                </span>
                                {variant.price &&
                                  variant.price !== data.price && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Riêng
                                    </Badge>
                                  )}
                                {!variant.price && (
                                  <Badge variant="outline" className="text-xs">
                                    Mặc định
                                  </Badge>
                                )}
                              </div>
                            </div>
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
