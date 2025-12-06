"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useProduct } from "@/hooks/use-api-cache";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  User,
  Sparkles,
  Archive,
  Eye,
  EyeOff,
  ShoppingBag,
  Percent,
  Star,
  TrendingUp,
  Box,
  CheckCircle2,
  XCircle,
  Info,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  material: { name: string } | null;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { data, isLoading, error } = useProduct(storeId, productId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (data?.images && data.images.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [data]);

  if (!isMounted) return null;

  const totalInventory =
    data?.variants?.reduce((sum: number, v: any) => sum + v.inventory, 0) || 0;

  const discountPercentage =
    data?.compareAtPrice && data.compareAtPrice > data.price
      ? Math.round(
          ((data.compareAtPrice - data.price) / data.compareAtPrice) * 100
        )
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none !w-screen !h-screen !m-0 !rounded-none flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border-0 shadow-2xl !inset-0 !translate-x-0 !translate-y-0 p-0 gap-0">
        {/* Simple Header - Gray & White */}
        <div className="relative bg-neutral-50 dark:bg-neutral-900 px-12 py-7 border-b border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-top duration-500">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-3xl font-normal tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 transition-all duration-300 hover:bg-neutral-300 dark:hover:bg-neutral-700">
                  <ShoppingBag className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
                </div>
                <span>Chi tiết sản phẩm</span>
              </DialogTitle>
              {data && (
                <div className="flex items-center gap-2">
                  {data.isPublished ? (
                    <Badge className="bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 border-neutral-300 dark:border-neutral-700 gap-1.5 px-3 py-1.5 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all duration-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-medium">Đã xuất bản</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 gap-1.5 px-3 py-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Bản nháp</span>
                    </Badge>
                  )}
                  {data.isFeatured && (
                    <Badge className="bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 border-neutral-300 dark:border-neutral-700 gap-1.5 px-3 py-1.5 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all duration-300">
                      <Star className="h-3.5 w-3.5 fill-neutral-700 dark:fill-neutral-300" />
                      <span className="font-medium">Nổi bật</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {data && (
              <p className="text-sm font-mono text-neutral-500 dark:text-neutral-400 tracking-wider">
                {data.slug}
              </p>
            )}
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-32">
            <div className="text-center space-y-6 animate-in fade-in-0 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                <Loader2 className="h-16 w-16 animate-spin text-neutral-600 dark:text-neutral-400 mx-auto relative z-10" />
              </div>
              <p className="text-lg font-light text-neutral-600 dark:text-neutral-400 tracking-wide">
                Đang tải thông tin sản phẩm...
              </p>
            </div>
          </div>
        ) : data ? (
          <ScrollArea className="flex-1">
            <div className="p-12 space-y-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              {/* Hero Section - Wide Layout */}
              <div className="grid grid-cols-12 gap-10">
                {/* Product Images - Left Side */}
                <div className="col-span-12 lg:col-span-5 space-y-5">
                  {/* Main Image */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 group transition-all duration-500 hover:shadow-2xl">
                    {data.images && data.images.length > 0 ? (
                      <>
                        <Image
                          src={
                            data.images[selectedImageIndex]?.url ||
                            data.images[0].url
                          }
                          fill
                          alt={data.name}
                          className="object-cover transition-all duration-700 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto w-fit">
                            <ImageIcon className="h-16 w-16 text-neutral-400" />
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light">
                            Chưa có hình ảnh
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {data.images && data.images.length > 1 && (
                    <div className="grid grid-cols-5 gap-3">
                      {data.images
                        .slice(0, 5)
                        .map((img: { url: string }, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={cn(
                              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105",
                              selectedImageIndex === idx
                                ? "border-neutral-900 dark:border-neutral-100 shadow-lg scale-105"
                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
                            )}
                          >
                            <Image
                              src={img.url}
                              fill
                              alt={`${data.name} ${idx + 1}`}
                              className="object-cover transition-all duration-300"
                            />
                            {selectedImageIndex === idx && (
                              <div className="absolute inset-0 bg-neutral-900/10 dark:bg-neutral-100/10" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Product Info - Right Side */}
                <div className="col-span-12 lg:col-span-7 space-y-8">
                  {/* Product Title & Badges */}
                  <div className="space-y-5">
                    <h1 className="text-5xl lg:text-6xl font-light tracking-tight leading-tight text-neutral-900 dark:text-neutral-50">
                      {data.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3">
                      {data.isArchived && (
                        <Badge
                          variant="destructive"
                          className="gap-1.5 px-3 py-1.5"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>Đã lưu trữ</span>
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="gap-1.5 px-3 py-1.5 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{data.category?.name || "N/A"}</span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="gap-1.5 px-3 py-1.5 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span className="uppercase">
                          {data.gender || "UNISEX"}
                        </span>
                      </Badge>
                      {data.material && (
                        <Badge
                          variant="outline"
                          className="gap-1.5 px-3 py-1.5 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          <span>{data.material.name}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-neutral-200 dark:bg-neutral-800" />

                  {/* Price Section - Simple Gray & White */}
                  <div className="relative bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 transition-all duration-500 hover:shadow-xl">
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4 tracking-wide uppercase">
                      Giá bán
                    </p>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-5xl lg:text-6xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">
                        {formatter.format(data.price)}
                      </span>
                      {data.compareAtPrice &&
                        data.compareAtPrice > data.price && (
                          <>
                            <span className="text-2xl line-through text-neutral-400 dark:text-neutral-600 font-light">
                              {formatter.format(data.compareAtPrice)}
                            </span>
                            <Badge className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-0 gap-1.5 px-4 py-2 text-base font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-300">
                              <TrendingUp className="h-4 w-4" />
                              Giảm {discountPercentage}%
                            </Badge>
                          </>
                        )}
                    </div>
                  </div>

                  {/* Stats Grid - Simple Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-500 hover:shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                          <Package className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                        Tồn kho
                      </p>
                      <p className="text-3xl font-light text-neutral-900 dark:text-neutral-50">
                        {totalInventory}
                      </p>
                    </div>

                    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-500 hover:shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                          <Layers className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                        Biến thể
                      </p>
                      <p className="text-3xl font-light text-neutral-900 dark:text-neutral-50">
                        {data.variants?.length || 0}
                      </p>
                    </div>

                    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-500 hover:shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                          <ImageIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                        Hình ảnh
                      </p>
                      <p className="text-3xl font-light text-neutral-900 dark:text-neutral-50">
                        {data.images?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section - Simple Design */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start border-b border-neutral-200 dark:border-neutral-800 rounded-none bg-transparent p-0 h-auto gap-1">
                  <TabsTrigger
                    value="details"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 transition-all duration-300"
                  >
                    Chi tiết
                  </TabsTrigger>
                  <TabsTrigger
                    value="variants"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 transition-all duration-300"
                  >
                    Biến thể{" "}
                    <span className="ml-2 text-xs">
                      ({data.variants?.length || 0})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="seo"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 transition-all duration-300"
                  >
                    SEO & Tags
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-8 space-y-6">
                  {/* Description */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500 hover:shadow-lg">
                    <h3 className="text-xl font-light mb-6 flex items-center gap-3 text-neutral-900 dark:text-neutral-50">
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <Info className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      Mô tả sản phẩm
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-light prose-p:text-neutral-700 dark:prose-p:text-neutral-300">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            data.description ||
                            "<p class='text-neutral-500 dark:text-neutral-400 italic'>Chưa có mô tả sản phẩm</p>",
                        }}
                      />
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500 hover:shadow-lg">
                      <h4 className="text-lg font-light mb-6 flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
                        <Box className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        Cài đặt hàng tồn kho
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Theo dõi tồn kho
                          </span>
                          <Badge
                            variant={data.trackQuantity ? "default" : "outline"}
                            className={cn(
                              data.trackQuantity
                                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-0"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700"
                            )}
                          >
                            {data.trackQuantity ? "Bật" : "Tắt"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Cho phép đặt hàng khi hết
                          </span>
                          <Badge
                            variant={
                              data.allowBackorder ? "default" : "outline"
                            }
                            className={cn(
                              data.allowBackorder
                                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-0"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700"
                            )}
                          >
                            {data.allowBackorder ? "Có" : "Không"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500 hover:shadow-lg">
                      <h4 className="text-lg font-light mb-6 flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
                        <Calendar className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        Thông tin thời gian
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Ngày tạo
                          </span>
                          <span className="text-sm font-light text-neutral-600 dark:text-neutral-400">
                            {data.createdAt
                              ? format(
                                  new Date(data.createdAt),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "N/A"}
                          </span>
                        </div>
                        {data.publishedAt && (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Ngày xuất bản
                            </span>
                            <span className="text-sm font-light text-neutral-600 dark:text-neutral-400">
                              {format(
                                new Date(data.publishedAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value="variants" className="mt-8">
                  {data.variants && data.variants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {data.variants.map((variant: any, idx: number) => (
                        <div
                          key={variant.id || idx}
                          className="group bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-500 hover:shadow-xl"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Size */}
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                                <Ruler className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                                  Size
                                </p>
                                <p className="text-lg font-light text-neutral-900 dark:text-neutral-50">
                                  {variant.size?.name || "N/A"}
                                </p>
                                {variant.size?.value && (
                                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                                    {variant.size.value}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Color */}
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                                <Palette className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                                  Màu sắc
                                </p>
                                <div className="flex items-center gap-2">
                                  {variant.color?.value && (
                                    <div
                                      className="h-6 w-6 rounded-full border-2 border-neutral-300 dark:border-neutral-700 shadow-sm ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                                      style={{
                                        backgroundColor: variant.color.value,
                                      }}
                                    />
                                  )}
                                  <p className="text-lg font-light text-neutral-900 dark:text-neutral-50">
                                    {variant.color?.name || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Inventory */}
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                                <Package className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                                  Tồn kho
                                </p>
                                <p
                                  className={cn(
                                    "text-2xl font-light",
                                    variant.inventory <=
                                      variant.lowStockThreshold
                                      ? "text-neutral-700 dark:text-neutral-300"
                                      : "text-neutral-900 dark:text-neutral-50"
                                  )}
                                >
                                  {variant.inventory}
                                </p>
                                {variant.inventory <=
                                  variant.lowStockThreshold && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-neutral-700 dark:text-neutral-300 border-neutral-400 dark:border-neutral-600 mt-1"
                                  >
                                    Sắp hết
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                                <TrendingUp className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                                  Giá
                                </p>
                                <p className="text-xl font-light text-neutral-900 dark:text-neutral-50">
                                  {variant.price
                                    ? formatter.format(variant.price)
                                    : formatter.format(data.price)}
                                </p>
                              </div>
                            </div>

                            {/* SKU */}
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                                <Tag className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                                  SKU
                                </p>
                                <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400">
                                  {variant.sku || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                      <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto w-fit mb-4">
                        <Package className="h-16 w-16 mx-auto text-neutral-400" />
                      </div>
                      <p className="text-lg font-light">Chưa có biến thể nào</p>
                    </div>
                  )}
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="mt-8 space-y-6">
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500 hover:shadow-lg">
                    <h3 className="text-xl font-light mb-6 flex items-center gap-3 text-neutral-900 dark:text-neutral-50">
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <Sparkles className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      SEO Metadata
                    </h3>
                    <div className="space-y-6">
                      {data.metaTitle ? (
                        <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                            Meta Title
                          </p>
                          <p className="text-base font-light text-neutral-900 dark:text-neutral-50">
                            {data.metaTitle}
                          </p>
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-800/50">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                            Chưa có meta title
                          </p>
                        </div>
                      )}
                      {data.metaDescription && (
                        <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                            Meta Description
                          </p>
                          <p className="text-base font-light text-neutral-900 dark:text-neutral-50 leading-relaxed">
                            {data.metaDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {data.tags && data.tags.length > 0 && (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500 hover:shadow-lg">
                      <h3 className="text-xl font-light mb-6 flex items-center gap-3 text-neutral-900 dark:text-neutral-50">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <Tag className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {data.tags.map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-sm px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-0 font-light hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-light">
                    Tạo lúc{" "}
                    {data.createdAt
                      ? format(new Date(data.createdAt), "PPP 'lúc' HH:mm")
                      : "N/A"}
                  </span>
                </div>
                <span className="font-mono text-xs tracking-wider">
                  ID: {data.id}
                </span>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center py-32 text-neutral-500 dark:text-neutral-400">
            <div className="text-center space-y-4 animate-in fade-in-0 duration-500">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto w-fit">
                <Package className="h-16 w-16 mx-auto text-neutral-400" />
              </div>
              <p className="text-lg font-light">
                Không tìm thấy dữ liệu sản phẩm
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
