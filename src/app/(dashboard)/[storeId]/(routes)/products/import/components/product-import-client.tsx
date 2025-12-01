"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ProductImportPreview } from "./product-import-preview";
import axios from "axios";
import { handleError } from "@/lib/error-handler";

interface ProductImportClientProps {
  categories: Array<{ id: string; name: string }>;
  sizes: Array<{ id: string; name: string; value: string }>;
  colors: Array<{ id: string; name: string; value: string }>;
  materials: Array<{ id: string; name: string }>;
}

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

export const ProductImportClient: React.FC<ProductImportClientProps> = ({
  categories,
  sizes,
  colors,
  materials,
}) => {
  const router = useRouter();
  const params = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Create mapping objects for quick lookup
  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  );
  const sizeMap = new Map(sizes.map((s) => [s.name.toLowerCase(), s.id]));
  const colorMap = new Map(colors.map((c) => [c.name.toLowerCase(), c.id]));
  const materialMap = new Map(
    materials.map((m) => [m.name.toLowerCase(), m.id])
  );

  // Also map by ID
  categories.forEach((c) => categoryMap.set(c.id.toLowerCase(), c.id));
  sizes.forEach((s) => sizeMap.set(s.id.toLowerCase(), s.id));
  colors.forEach((c) => colorMap.set(c.id.toLowerCase(), c.id));
  materials.forEach((m) => materialMap.set(m.id.toLowerCase(), m.id));

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setIsParsing(true);
      setParsedData([]);
      setShowPreview(false);

      try {
        let rawData: any[] = [];

        // Parse based on file type
        if (selectedFile.name.endsWith(".csv")) {
          rawData = await parseCSV(selectedFile);
        } else if (
          selectedFile.name.endsWith(".xlsx") ||
          selectedFile.name.endsWith(".xls")
        ) {
          rawData = await parseExcel(selectedFile);
        } else {
          toast.error("Chỉ hỗ trợ file CSV hoặc Excel (.xlsx, .xls)");
          setIsParsing(false);
          return;
        }

        if (rawData.length === 0) {
          toast.error("File không có dữ liệu");
          setIsParsing(false);
          return;
        }

        // Validate and transform data
        const validated = validateAndTransform(rawData, {
          categoryMap,
          sizeMap,
          colorMap,
          materialMap,
        });

        setParsedData(validated);
        setShowPreview(true);
        toast.success(`Đã parse ${validated.length} sản phẩm`);
      } catch (error: any) {
        handleError(
          error,
          "Lỗi khi parse file. Vui lòng kiểm tra định dạng file."
        );
      } finally {
        setIsParsing(false);
      }
    },
    [categoryMap, sizeMap, colorMap, materialMap]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Không có dữ liệu để import");
      return;
    }

    // Filter out products with errors
    const validProducts = parsedData.filter(
      (p) => !p.errors || p.errors.length === 0
    );

    if (validProducts.length === 0) {
      toast.error("Không có sản phẩm hợp lệ để import");
      return;
    }

    setIsImporting(true);

    try {
      // Transform to API format
      const productsToImport = validProducts.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
        categoryId: p.categoryId,
        gender: p.gender,
        isPublished: p.isPublished ?? true,
        isFeatured: p.isFeatured ?? false,
        compareAtPrice: p.compareAtPrice,
        materialId: p.materialId,
        tags: p.tags || [],
        images: (p.imageUrls || []).map((url) => ({ url })),
        variants: p.variants,
      }));

      // Call API to create products
      const response = await axios.post<{
        success: boolean;
        count: number;
        errors?: Array<{ index: number; message: string }>;
        total: number;
        message?: string;
      }>(`/api/${params.storeId}/products/bulk-import`, {
        products: productsToImport,
      });

      if (response.data.success) {
        toast.success(`Đã import thành công ${response.data.count} sản phẩm!`);
        router.push(`/${params.storeId}/products`);
        router.refresh();
      } else {
        throw new Error(response.data.message || "Import failed");
      }
    } catch (error: any) {
      handleError(error, "Có lỗi xảy ra khi import sản phẩm");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create template CSV
    const template = [
      {
        name: "Áo thun nam",
        price: "150000",
        description: "Áo thun cotton 100%",
        category: categories[0]?.name || "Category Name",
        gender: "MEN",
        size: sizes[0]?.name || "M",
        color: colors[0]?.name || "Đen",
        inventory: "100",
        imageUrls: "https://example.com/img1.jpg,https://example.com/img2.jpg",
        isPublished: "true",
        isFeatured: "false",
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product-import-template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading
            title="Import Sản Phẩm"
            description="Import nhiều sản phẩm từ file CSV hoặc Excel"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${params.storeId}/products`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <Separator />

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">1. Upload File</h3>
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Tải Template CSV
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
            }
          `}
        >
          <input {...getInputProps()} />
          {isParsing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-medium">Đang parse file...</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {parsedData.length} sản phẩm đã được parse
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setParsedData([]);
                  setShowPreview(false);
                }}
              >
                Chọn file khác
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium mb-2">
                  Kéo thả file vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-gray-500">
                  Hỗ trợ CSV và Excel (.xlsx, .xls)
                </p>
              </div>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Chọn File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && parsedData.length > 0 && (
        <ProductImportPreview
          data={parsedData}
          onImport={handleImport}
          isImporting={isImporting}
        />
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Hướng dẫn Format File
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Các cột bắt buộc:</strong> name, price, description,
            category, gender, size, color, inventory
          </p>
          <p>
            <strong>Các cột tùy chọn:</strong> compareAtPrice, material, tags,
            imageUrls, isPublished, isFeatured, sku, lowStockThreshold
          </p>
          <p>
            <strong>Lưu ý:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              Category, Size, Color, Material phải khớp với dữ liệu có sẵn
            </li>
            <li>
              ImageUrls: phân cách bằng dấu phẩy (ví dụ: url1.jpg,url2.jpg)
            </li>
            <li>Tags: phân cách bằng dấu phẩy (ví dụ: sale,hot)</li>
            <li>Gender: MEN, WOMEN, KIDS, hoặc UNISEX</li>
            <li>isPublished, isFeatured: true hoặc false</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Parse CSV file
async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          // Log warnings but don't block parsing if there's data
          if (process.env.NODE_ENV === "development") {
            console.warn("CSV parsing warnings:", results.errors);
          }
        }
        resolve(results.data as any[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// Parse Excel file
async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData as any[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Validate and transform data
function validateAndTransform(
  rawData: any[],
  maps: {
    categoryMap: Map<string, string>;
    sizeMap: Map<string, string>;
    colorMap: Map<string, string>;
    materialMap: Map<string, string>;
  }
): ParsedProduct[] {
  const { categoryMap, sizeMap, colorMap, materialMap } = maps;
  const result: ParsedProduct[] = [];

  rawData.forEach((row, index) => {
    const errors: string[] = [];
    const rowNum = index + 2; // +2 because Excel/CSV starts at row 2 (row 1 is header)

    // Required fields
    const name = String(row.name || row.Name || "").trim();
    const price = parseFloat(row.price || row.Price || 0);
    const description = String(row.description || row.Description || "").trim();
    const category = String(
      row.category || row.Category || row.categoryId || ""
    ).trim();
    const gender = String(row.gender || row.Gender || "UNISEX")
      .trim()
      .toUpperCase() as "MEN" | "WOMEN" | "KIDS" | "UNISEX";
    const size = String(row.size || row.Size || row.sizeId || "").trim();
    const color = String(row.color || row.Color || row.colorId || "").trim();
    const inventory = parseInt(row.inventory || row.Inventory || "0", 10);

    // Validation
    if (!name) errors.push(`Row ${rowNum}: Thiếu tên sản phẩm`);
    if (!price || isNaN(price) || price <= 0)
      errors.push(`Row ${rowNum}: Giá không hợp lệ`);
    if (!description) errors.push(`Row ${rowNum}: Thiếu mô tả`);

    const categoryId = categoryMap.get(category.toLowerCase());
    if (!categoryId)
      errors.push(`Row ${rowNum}: Category "${category}" không tồn tại`);

    if (!["MEN", "WOMEN", "KIDS", "UNISEX"].includes(gender))
      errors.push(
        `Row ${rowNum}: Gender không hợp lệ (phải là MEN/WOMEN/KIDS/UNISEX)`
      );

    const sizeId = sizeMap.get(size.toLowerCase());
    if (!sizeId) errors.push(`Row ${rowNum}: Size "${size}" không tồn tại`);

    const colorId = colorMap.get(color.toLowerCase());
    if (!colorId) errors.push(`Row ${rowNum}: Color "${color}" không tồn tại`);

    if (isNaN(inventory) || inventory < 0)
      errors.push(`Row ${rowNum}: Inventory không hợp lệ`);

    // Optional fields
    const compareAtPrice = row.compareAtPrice
      ? parseFloat(row.compareAtPrice)
      : undefined;
    const material = row.material || row.Material || row.materialId || "";
    const materialId = material
      ? materialMap.get(String(material).toLowerCase())
      : undefined;

    const tags =
      row.tags || row.Tags
        ? String(row.tags || row.Tags)
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t)
        : [];

    const imageUrls =
      row.imageUrls || row.imageUrls || row.images
        ? String(row.imageUrls || row.imageUrls || row.images)
            .split(",")
            .map((url: string) => url.trim())
            .filter((url: string) => url)
        : [];

    const isPublished =
      row.isPublished !== undefined
        ? String(row.isPublished).toLowerCase() === "true"
        : true;
    const isFeatured =
      row.isFeatured !== undefined
        ? String(row.isFeatured).toLowerCase() === "true"
        : false;

    // Variant
    const variant = {
      sizeId: sizeId!,
      colorId: colorId!,
      materialId,
      inventory,
      sku: row.sku || row.SKU || undefined,
      price: row.variantPrice ? parseFloat(row.variantPrice) : undefined,
      lowStockThreshold: row.lowStockThreshold
        ? parseInt(row.lowStockThreshold, 10)
        : 10,
    };

    result.push({
      name,
      price,
      description,
      categoryId: categoryId!,
      gender,
      isPublished,
      isFeatured,
      compareAtPrice,
      materialId,
      tags,
      imageUrls,
      variants: [variant],
      errors: errors.length > 0 ? errors : undefined,
    });
  });

  return result;
}
