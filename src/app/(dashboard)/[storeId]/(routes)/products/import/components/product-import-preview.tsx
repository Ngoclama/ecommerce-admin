"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type ParsedProduct = {
  name: string;
  price: number;
  description: string;
  categoryId: string;
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX";
  isPublished?: boolean;
  isFeatured?: boolean;
  compareAtPrice?: number;
  materialId?: string;
  tags?: string[];
  imageUrls?: string[];
  variants: Array<{
    sizeId: string;
    colorId: string;
    materialId?: string;
    inventory: number;
    sku?: string;
    price?: number;
    lowStockThreshold?: number;
  }>;
  errors?: string[];
};

interface ProductImportPreviewProps {
  data: ParsedProduct[];
  onImport: () => void;
  isImporting: boolean;
}

export const ProductImportPreview: React.FC<ProductImportPreviewProps> = ({
  data,
  onImport,
  isImporting,
}) => {
  const validProducts = data.filter((p) => !p.errors || p.errors.length === 0);
  const invalidProducts = data.filter((p) => p.errors && p.errors.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">2. Xem trước và Import</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">
              {validProducts.length} hợp lệ
            </span>
          </div>
          {invalidProducts.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">
                {invalidProducts.length} lỗi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {validProducts.length}
          </div>
          <div className="text-sm text-green-700">Sản phẩm hợp lệ</div>
        </div>
        {invalidProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {invalidProducts.length}
            </div>
            <div className="text-sm text-red-700">Sản phẩm lỗi</div>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          <div className="text-sm text-blue-700">Tổng cộng</div>
        </div>
      </div>

      {/* Valid Products Table */}
      {validProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Sản phẩm hợp lệ ({validProducts.length})
          </h4>
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </TableCell>
                      <TableCell>{product.categoryId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.gender}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {product.variants.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {v.inventory} items
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {product.imageUrls.length} ảnh
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {product.isPublished && (
                            <Badge variant="default" className="text-xs">
                              Published
                            </Badge>
                          )}
                          {product.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Invalid Products */}
      {invalidProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            Sản phẩm có lỗi ({invalidProducts.length})
          </h4>
          <div className="border border-red-200 rounded-lg">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead className="w-[400px]">Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invalidProducts.map((product, index) => (
                    <TableRow key={index} className="bg-red-50/50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {product.name || "(Không có tên)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {product.errors?.map((error, i) => (
                            <div
                              key={i}
                              className="text-xs text-red-600 flex items-start gap-1"
                            >
                              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      )}

      <Separator />

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          onClick={onImport}
          disabled={validProducts.length === 0 || isImporting}
          size="lg"
          className="min-w-[200px]"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang import...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import {validProducts.length} sản phẩm
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

