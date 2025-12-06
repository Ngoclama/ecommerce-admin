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
  categories: Array<{
    id: string;
    name: string;
    parentId: string | null;
    parent?: { id: string; name: string } | null;
  }>;
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
  const [uploadedImages, setUploadedImages] = useState<Map<string, string>>(
    new Map()
  ); // Map: productName -> imageUrl
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Create mapping objects for quick lookup
  // Support category hierarchy: "Parent > Child" or just "Category Name"
  const categoryMap = new Map<string, string>();

  // Map by name (for root categories)
  categories.forEach((c) => {
    if (!c.parentId) {
      categoryMap.set(c.name.toLowerCase(), c.id);
    }
  });

  // Map by "Parent > Child" format
  categories.forEach((c) => {
    if (c.parentId && c.parent) {
      const fullPath = `${c.parent.name} > ${c.name}`;
      categoryMap.set(fullPath.toLowerCase(), c.id);
    }
  });

  // Also map by ID
  categories.forEach((c) => categoryMap.set(c.id.toLowerCase(), c.id));

  const sizeMap = new Map(sizes.map((s) => [s.name.toLowerCase(), s.id]));
  const colorMap = new Map(colors.map((c) => [c.name.toLowerCase(), c.id]));
  const materialMap = new Map(
    materials.map((m) => [m.name.toLowerCase(), m.id])
  );

  // Also map by ID
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

  // Handle image uploads
  const handleImageUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploadingImages(true);
      const newImageMap = new Map(uploadedImages);

      try {
        // Upload images in parallel
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const data = await response.json();
          return { fileName: file.name, url: data.url };
        });

        const results = await Promise.all(uploadPromises);

        // Map images to products by filename (remove extension)
        results.forEach(({ fileName, url }) => {
          const productName = fileName
            .replace(/\.[^/.]+$/, "") // Remove extension
            .toLowerCase()
            .trim();

          // Try to find matching product
          const matchingProduct = parsedData.find(
            (p) => p.name.toLowerCase().trim() === productName
          );

          if (matchingProduct) {
            // Add to existing imageUrls or create new array
            if (!matchingProduct.imageUrls) {
              matchingProduct.imageUrls = [];
            }
            matchingProduct.imageUrls.push(url);
            newImageMap.set(matchingProduct.name, url);
          } else {
            // Store by filename for later mapping
            newImageMap.set(fileName, url);
          }
        });

        setUploadedImages(newImageMap);

        // Update parsedData with new image URLs
        const updatedData = parsedData.map((product) => {
          const imageUrl = newImageMap.get(product.name);
          if (imageUrl && !product.imageUrls?.includes(imageUrl)) {
            return {
              ...product,
              imageUrls: [...(product.imageUrls || []), imageUrl],
            };
          }
          return product;
        });

        setParsedData(updatedData);
        toast.success(`Đã upload ${results.length} ảnh thành công!`);
      } catch (error: any) {
        handleError(error, "Có lỗi xảy ra khi upload ảnh");
      } finally {
        setIsUploadingImages(false);
      }
    },
    [uploadedImages, parsedData]
  );

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } =
    useDropzone({
      onDrop: handleImageUpload,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      },
      multiple: true,
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
    // Get example category with parent if available
    const exampleCategory = categories.find((c) => c.parent)
      ? `${categories.find((c) => c.parent)!.parent!.name} > ${
          categories.find((c) => c.parent)!.name
        }`
      : categories[0]?.name || "Category Name";

    // Create template CSV with all optional columns
    const template = [
      {
        name: "Áo thun nam",
        price: "150000",
        compareAtPrice: "200000", // Optional
        description: "Áo thun cotton 100%",
        category: exampleCategory, // Support "Parent > Child" format
        gender: "MEN",
        size: sizes[0]?.name || "M", // Có thể dùng "L,S,M" để tạo nhiều variants
        color: colors[0]?.name || "Đen", // Có thể dùng "Trắng,Đen,Xanh" để tạo nhiều variants
        material: materials[0]?.name || "", // Optional
        inventory: "100", // Nếu có nhiều size/color, có thể dùng "50,30,20" để phân bổ inventory
        sku: "SKU-001", // Optional
        lowStockThreshold: "10", // Optional
        tags: "sale,hot,new", // Optional - comma separated
        imageUrls: "https://example.com/img1.jpg,https://example.com/img2.jpg", // Optional - comma separated or upload files
        isPublished: "true", // Optional - default: true
        isFeatured: "false", // Optional - default: false
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
          <h3 className="text-lg font-semibold">1. Upload File CSV/Excel</h3>
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

      {/* Image Upload Section */}
      {showPreview && parsedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            2. Upload Hình Ảnh (Tùy chọn)
          </h3>
          <div
            {...getImageRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200
              ${
                isUploadingImages
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
              }
            `}
          >
            <input {...getImageInputProps()} />
            {isUploadingImages ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Đang upload ảnh...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium">
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className="text-xs text-gray-500">
                  Hỗ trợ PNG, JPG, JPEG, GIF, WEBP. Tên file nên khớp với tên
                  sản phẩm để tự động map.
                </p>
                {uploadedImages.size > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    Đã upload {uploadedImages.size} ảnh
                  </p>
                )}
              </div>
            )}
          </div>
          {uploadedImages.size > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                <strong>Lưu ý:</strong> Ảnh sẽ tự động được map với sản phẩm nếu
                tên file khớp với tên sản phẩm (không phân biệt hoa thường, bỏ
                qua phần mở rộng). Bạn cũng có thể nhập URLs trực tiếp vào cột
                imageUrls trong CSV.
              </p>
            </div>
          )}
        </div>
      )}

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
          <p className="text-xs text-gray-600 mt-1">
            <strong>Lưu ý:</strong> Size và Color có thể là danh sách phân cách
            bằng dấu phẩy (ví dụ: "L,S,M" hoặc "Trắng,Đen,Xanh") để tạo nhiều
            variants tự động.
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
              <strong>Category:</strong> Sử dụng format "Parent &gt; Child" cho
              category con (ví dụ: "Áo &gt; Áo thun") hoặc chỉ tên category cho
              category cha
            </li>
            <li>
              Size, Color, Material phải khớp chính xác với dữ liệu có sẵn. Size
              và Color có thể là danh sách phân cách bằng dấu phẩy để tạo nhiều
              variants (ví dụ: "L,S,M" hoặc "Trắng,Đen,Xanh")
            </li>
            <li>
              <strong>ImageUrls:</strong> Phân cách bằng dấu phẩy (ví dụ:
              url1.jpg,url2.jpg) hoặc upload ảnh từ máy tính
            </li>
            <li>
              <strong>Lưu ý về Encoding:</strong> Nếu file CSV có ký tự tiếng
              Việt bị lỗi (ví dụ: "Tráº¯ng" thay vì "Trắng"), hệ thống sẽ tự
              động sửa. Tuy nhiên, để tránh lỗi, nên lưu file CSV với encoding
              UTF-8. Trong Excel: File → Save As → CSV UTF-8 (Comma delimited)
              (*.csv)
            </li>
            <li>Tags: Phân cách bằng dấu phẩy (ví dụ: sale,hot,new)</li>
            <li>Gender: MEN, WOMEN, KIDS, hoặc UNISEX</li>
            <li>
              isPublished, isFeatured: true hoặc false (mặc định:
              isPublished=true, isFeatured=false)
            </li>
            <li>compareAtPrice: Giá so sánh (tùy chọn)</li>
            <li>sku: Mã SKU cho variant (tùy chọn)</li>
            <li>
              lowStockThreshold: Ngưỡng cảnh báo tồn kho thấp (tùy chọn, mặc
              định: 10)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Parse CSV file with UTF-8 encoding support and encoding fix
async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // Read file as text - try UTF-8 first, then Windows-1252 (common Excel encoding)
    const reader = new FileReader();

    const tryParse = (text: string, encoding: string) => {
      try {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: encoding,
          complete: (results) => {
            if (results.errors.length > 0) {
              // Log warnings but don't block parsing if there's data
              if (process.env.NODE_ENV === "development") {
                console.warn("CSV parsing warnings:", results.errors);
              }
            }
            resolve(results.data as any[]);
          },
          error: (error: Error) => {
            reject(error);
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    // Try UTF-8 first
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Check if text contains mojibake patterns (encoding errors)
        const hasMojibake = /áº|á»|º|¯|²|³|µ|·/.test(text);

        if (hasMojibake) {
          // Try to decode as Windows-1252 and convert to UTF-8
          // This is a common issue when Excel saves CSV with ANSI encoding
          console.warn("[CSV] Detected encoding issues, attempting to fix...");
        }

        tryParse(text, "UTF-8");
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);

    // Try UTF-8 first
    reader.readAsText(file, "UTF-8");
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

    // Support multiple sizes and colors (comma-separated)
    const sizeInput = String(row.size || row.Size || row.sizeId || "").trim();
    const colorInput = String(
      row.color || row.Color || row.colorId || ""
    ).trim();
    const inventoryInput = String(row.inventory || row.Inventory || "0").trim();

    // Validation
    if (!name) errors.push(`Row ${rowNum}: Thiếu tên sản phẩm`);
    if (!price || isNaN(price) || price <= 0)
      errors.push(`Row ${rowNum}: Giá không hợp lệ`);
    if (!description) errors.push(`Row ${rowNum}: Thiếu mô tả`);

    // Support category hierarchy: "Parent > Child" or just "Category Name"
    let categoryId = categoryMap.get(category.toLowerCase());

    // If not found, try to find by exact match (case-insensitive)
    if (!categoryId) {
      for (const [key, value] of categoryMap.entries()) {
        if (key === category.toLowerCase()) {
          categoryId = value;
          break;
        }
      }
    }

    if (!categoryId) {
      errors.push(
        `Row ${rowNum}: Category "${category}" không tồn tại. Sử dụng format "Parent > Child" cho category con hoặc tên category cho category cha.`
      );
    }

    if (!["MEN", "WOMEN", "KIDS", "UNISEX"].includes(gender))
      errors.push(
        `Row ${rowNum}: Gender không hợp lệ (phải là MEN/WOMEN/KIDS/UNISEX)`
      );

    // Parse multiple sizes and colors
    const sizes = sizeInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    const colors = colorInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c);

    // Parse inventory - can be single value or comma-separated matching sizes/colors
    const inventoryValues = inventoryInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i)
      .map((i) => parseInt(i, 10));

    // Validate sizes and colors
    const sizeIds: string[] = [];
    const colorIds: string[] = [];

    sizes.forEach((size) => {
      const sizeId = sizeMap.get(size.toLowerCase());
      if (!sizeId) {
        errors.push(`Row ${rowNum}: Size "${size}" không tồn tại`);
      } else {
        sizeIds.push(sizeId);
      }
    });

    colors.forEach((color) => {
      // Try to find color by original name first
      let colorId = colorMap.get(color.toLowerCase());

      // If not found, try to fix encoding issues
      if (!colorId) {
        // Fix common encoding issues (mojibake)
        // Pattern: "Tráº¯ng" -> "Trắng", "?en" -> "Đen", etc.
        let fixedColor = color
          // Fix "áº¯" -> "ắ" (common mojibake for "ắ")
          .replace(/áº¯/gi, "ắ")
          .replace(/áº±/gi, "ằ")
          .replace(/áº³/gi, "ẳ")
          .replace(/áºµ/gi, "ẵ")
          .replace(/áº·/gi, "ặ")
          // Fix "áº" -> "ă"
          .replace(/áº/gi, "ă")
          // Fix "á»" -> "ơ"
          .replace(/á»/gi, "ơ")
          .replace(/á»›/gi, "ớ")
          .replace(/á»/gi, "ờ")
          .replace(/á»Ÿ/gi, "ở")
          .replace(/á»¡/gi, "ỡ")
          .replace(/á»£/gi, "ợ")
          // Fix "áº¥" -> "ấ"
          .replace(/áº¥/gi, "ấ")
          .replace(/áº§/gi, "ầ")
          .replace(/áº©/gi, "ẩ")
          .replace(/áº«/gi, "ẫ")
          .replace(/áº­/gi, "ậ")
          // Fix "áº" -> "â"
          .replace(/áº/gi, "â")
          // Fix "áº" -> "ê"
          .replace(/áº/gi, "ê")
          .replace(/áº¿/gi, "ế")
          .replace(/á»/gi, "ề")
          .replace(/á»ƒ/gi, "ể")
          .replace(/á»…/gi, "ễ")
          .replace(/á»‡/gi, "ệ")
          // Fix "áº" -> "ô"
          .replace(/áº/gi, "ô")
          .replace(/á»'/gi, "ố")
          .replace(/á»"/gi, "ồ")
          .replace(/á»•/gi, "ổ")
          .replace(/á»—/gi, "ỗ")
          .replace(/á»™/gi, "ộ")
          // Fix "áº" -> "ư"
          .replace(/áº/gi, "ư")
          .replace(/á»©/gi, "ứ")
          .replace(/á»«/gi, "ừ")
          .replace(/á»­/gi, "ử")
          .replace(/á»/gi, "ữ")
          .replace(/á»±/gi, "ự")
          // Fix single character replacements
          .replace(/[?]/g, "Đ")
          .replace(/[?]/g, "đ")
          .replace(/[?]/g, "á")
          .replace(/[?]/g, "à")
          .replace(/[?]/g, "ả")
          .replace(/[?]/g, "ã")
          .replace(/[?]/g, "ạ")
          .replace(/[?]/g, "é")
          .replace(/[?]/g, "è")
          .replace(/[?]/g, "ẻ")
          .replace(/[?]/g, "ẽ")
          .replace(/[?]/g, "ẹ")
          .replace(/[?]/g, "í")
          .replace(/[?]/g, "ì")
          .replace(/[?]/g, "ỉ")
          .replace(/[?]/g, "ĩ")
          .replace(/[?]/g, "ị")
          .replace(/[?]/g, "ó")
          .replace(/[?]/g, "ò")
          .replace(/[?]/g, "ỏ")
          .replace(/[?]/g, "õ")
          .replace(/[?]/g, "ọ")
          .replace(/[?]/g, "ú")
          .replace(/[?]/g, "ù")
          .replace(/[?]/g, "ủ")
          .replace(/[?]/g, "ũ")
          .replace(/[?]/g, "ụ")
          .replace(/[?]/g, "ý")
          .replace(/[?]/g, "ỳ")
          .replace(/[?]/g, "ỷ")
          .replace(/[?]/g, "ỹ")
          .replace(/[?]/g, "ỵ")
          // Remove common mojibake artifacts
          .replace(/º/g, "")
          .replace(/¯/g, "")
          .replace(/°/g, "")
          .replace(/²/g, "")
          .replace(/³/g, "")
          .replace(/µ/g, "")
          .replace(/·/g, "")
          .replace(/¹/g, "")
          .replace(/»/g, "")
          .replace(/¼/g, "")
          .replace(/½/g, "")
          .replace(/¾/g, "")
          .replace(/¿/g, "")
          .replace(/Ÿ/g, "")
          .replace(/¡/g, "")
          .replace(/£/g, "")
          .replace(/©/g, "")
          .replace(/«/g, "")
          .replace(/­/g, "")
          .replace(/±/g, "")
          .replace(/¥/g, "")
          .replace(/§/g, "")
          .replace(/©/g, "")
          .replace(/«/g, "")
          .replace(/­/g, "")
          .replace(/±/g, "")
          .replace(/'/g, "")
          .replace(/"/g, "")
          .replace(/•/g, "")
          .replace(/—/g, "")
          .replace(/™/g, "")
          .replace(/©/g, "")
          .replace(/«/g, "")
          .replace(/­/g, "")
          .replace(/±/g, "");

        // Try with fixed color
        colorId = colorMap.get(fixedColor.toLowerCase());

        // If still not found, try fuzzy matching with all colors
        if (!colorId) {
          // Try to match by removing all diacritics and comparing
          const normalizeForMatch = (str: string) =>
            str
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[đĐ]/g, "d")
              .replace(/[ăĂ]/g, "a")
              .replace(/[âÂ]/g, "a")
              .replace(/[êÊ]/g, "e")
              .replace(/[ôÔ]/g, "o")
              .replace(/[ơƠ]/g, "o")
              .replace(/[ưƯ]/g, "u");

          const normalizedFixed = normalizeForMatch(fixedColor);

          // Try to find by normalized match
          for (const [colorName, colorIdValue] of colorMap.entries()) {
            const normalizedColorName = normalizeForMatch(colorName);
            if (normalizedFixed === normalizedColorName) {
              colorId = colorIdValue;
              break;
            }
          }
        }
      }

      if (!colorId) {
        errors.push(`Row ${rowNum}: Color "${color}" không tồn tại`);
      } else {
        colorIds.push(colorId);
      }
    });

    // Validate inventory
    if (inventoryValues.length === 0) {
      errors.push(`Row ${rowNum}: Inventory không hợp lệ`);
    } else {
      inventoryValues.forEach((inv) => {
        if (isNaN(inv) || inv < 0) {
          errors.push(`Row ${rowNum}: Inventory "${inv}" không hợp lệ`);
        }
      });
    }

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

    // Create variants from all size/color combinations
    const variants: Array<{
      sizeId: string;
      colorId: string;
      materialId?: string;
      inventory: number;
      sku?: string;
      price?: number;
      lowStockThreshold?: number;
    }> = [];

    // If we have valid sizeIds and colorIds, create variants
    if (sizeIds.length > 0 && colorIds.length > 0) {
      // Use inventory distribution: if multiple inventory values, distribute them
      // Otherwise, use first inventory value for all variants
      const baseInventory =
        inventoryValues.length > 0 ? inventoryValues[0] : 100;
      const inventoryPerVariant = Math.floor(
        baseInventory / (sizeIds.length * colorIds.length)
      );

      sizeIds.forEach((sizeId, sizeIndex) => {
        colorIds.forEach((colorId, colorIndex) => {
          // Use specific inventory if available, otherwise distribute
          let variantInventory = baseInventory;
          if (
            inventoryValues.length >
            sizeIndex * colorIds.length + colorIndex
          ) {
            variantInventory =
              inventoryValues[sizeIndex * colorIds.length + colorIndex];
          } else if (
            inventoryValues.length ===
            sizeIds.length * colorIds.length
          ) {
            variantInventory =
              inventoryValues[sizeIndex * colorIds.length + colorIndex];
          } else {
            variantInventory = inventoryPerVariant || 10;
          }

          variants.push({
            sizeId,
            colorId,
            materialId,
            inventory: variantInventory,
            sku: row.sku || row.SKU || undefined,
            price: row.variantPrice ? parseFloat(row.variantPrice) : undefined,
            lowStockThreshold: row.lowStockThreshold
              ? parseInt(row.lowStockThreshold, 10)
              : 10,
          });
        });
      });
    }

    // Only add product if we have at least one valid variant
    if (variants.length > 0) {
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
        variants,
        errors: errors.length > 0 ? errors : undefined,
      });
    } else if (errors.length === 0) {
      // If no variants but no errors, add error
      errors.push(
        `Row ${rowNum}: Không thể tạo variant từ size và color đã cho`
      );
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
        variants: [],
        errors,
      });
    }
  });

  return result;
}
