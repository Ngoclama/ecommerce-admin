import * as z from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  images: z
    .object({ url: z.string() })
    .array()
    .min(1, "At least one image is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),

  // Các trường bổ sung
  materialId: z.string().optional().nullable(), // Cho phép null hoặc undefined (fallback)
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]).default("UNISEX"),
  description: z.string().min(1, "Description is required"),

  // SEO fields
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),

  // Product status
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
  isPublished: z.boolean().default(true).optional(),

  // Inventory management
  trackQuantity: z.boolean().default(true).optional(),
  allowBackorder: z.boolean().default(false).optional(),

  // QUAN TRỌNG: Variants với Size + Color + Material
  variants: z
    .array(
      z.object({
        sizeId: z.string().min(1, "Size is required"),
        colorId: z.string().min(1, "Color is required"),
        materialId: z.string().optional().nullable(), // Material trong variant
        sku: z.string().optional().nullable(),
        inventory: z.coerce.number().min(0, "Inventory must be 0 or more"),
        lowStockThreshold: z.coerce.number().min(0).optional().default(10),
        price: z.coerce.number().min(0).optional().nullable(), // Giá riêng cho variant
      })
    )
    .min(1, "At least one variant is required"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
