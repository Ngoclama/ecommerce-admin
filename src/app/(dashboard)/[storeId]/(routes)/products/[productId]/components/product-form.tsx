"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { NumericFormat } from "react-number-format";
import { z } from "zod";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash, Eye, Plus, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Editor } from "@/components/ui/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertModal } from "@/components/modals/alert-modal";
import { ProductViewModal } from "@/components/modals/product-view";
import ImageUpload from "@/components/ui/image-upload";

import {
  Category,
  Color,
  Image,
  Product,
  Size,
  Material,
  ProductVariant,
} from "@prisma/client";

// ─── 1. Zod Schema ─────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, "Product label is required"),
  images: z
    .array(z.object({ url: z.string() }))
    .min(1, "At least one image is required"),
  price: z.number().min(0, "Price must be a positive number"),
  compareAtPrice: z.number().min(0).nullable().optional(),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  materialId: z.string().nullable().optional(), // Fallback material
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]),
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
  isPublished: z.boolean().default(true).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]).optional(),
  trackQuantity: z.boolean().default(true).optional(),
  allowBackorder: z.boolean().default(false).optional(),
  variants: z
    .array(
      z.object({
        sizeId: z.string().min(1, "Size is required"),
        colorId: z.string().min(1, "Color is required"),
        materialId: z.string().nullable().optional(), // Material trong variant
        sku: z.string().nullable().optional(),
        inventory: z.number().min(0, "Inventory must be >= 0"),
        lowStockThreshold: z.number().min(0).default(10).optional(),
        price: z.number().min(0).nullable().optional(), // Giá riêng cho variant
      })
    )
    .min(1, "At least one variant is required"),
});

type ProductFormValues = z.infer<typeof formSchema>;

// ─── 2. Component PriceField ───────────────────────────────────
interface PriceFieldProps {
  form: UseFormReturn<ProductFormValues>;
  isLoading?: boolean;
  currency?: "VND" | "USD";
}

export const PriceField: React.FC<PriceFieldProps> = ({
  form,
  isLoading,
  currency = "VND",
}) => {
  const currencySymbol = useMemo(
    () => (currency === "USD" ? "$" : "₫"),
    [currency]
  );
  const placeholderText = useMemo(
    () =>
      currency === "USD" ? "Enter price in USD..." : "Enter price in VNĐ...",
    [currency]
  );

  return (
    <FormField
      control={form.control}
      name="price"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Price</FormLabel>
          <FormControl>
            <NumericFormat
              value={field.value}
              thousandSeparator={currency === "VND" ? "." : ","}
              decimalSeparator={currency === "VND" ? "," : "."}
              allowNegative={false}
              suffix={` ${currencySymbol}`}
              placeholder={placeholderText}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onValueChange={(values) => {
                field.onChange(values.floatValue ?? 0);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// ─── 3. Component ProductForm ──────────────────────────────────
interface ProductFormProps {
  initialData:
    | (Product & { images: Image[]; variants: ProductVariant[] })
    | null;
  categories: Category[];
  sizes: Size[];
  colors: Color[];
  materials: Material[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  sizes,
  colors,
  materials,
}) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData
    ? t("forms.product.title")
    : t("forms.product.titleCreate");
  const description = initialData
    ? t("forms.product.description")
    : t("forms.product.descriptionCreate");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = initialData as any;

  const defaultValues = product
    ? {
        name: product.name,
        description: product.description || "",
        price: parseFloat(String(product.price)),
        compareAtPrice: product.compareAtPrice
          ? parseFloat(String(product.compareAtPrice))
          : null,
        categoryId: product.categoryId,
        materialId: product.materialId || null,
        gender: product.gender || "UNISEX",
        images: product.images || [],
        isFeatured: product.isFeatured,
        isArchived: product.isArchived,
        isPublished:
          product.isPublished !== undefined ? product.isPublished : true,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        tags: product.tags || [],
        trackQuantity:
          product.trackQuantity !== undefined ? product.trackQuantity : true,
        allowBackorder:
          product.allowBackorder !== undefined ? product.allowBackorder : false,
        variants:
          product.variants && product.variants.length > 0
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              product.variants.map((v: any) => ({
                sizeId: v.sizeId,
                colorId: v.colorId,
                materialId: v.materialId || null,
                sku: v.sku || null,
                inventory: v.inventory,
                lowStockThreshold: v.lowStockThreshold || 10,
                price: v.price ? parseFloat(String(v.price)) : null,
              }))
            : [
                {
                  sizeId: "",
                  colorId: "",
                  materialId: null,
                  sku: null,
                  inventory: 10,
                  lowStockThreshold: 10,
                  price: null,
                },
              ],
      }
    : {
        name: "",
        description: "",
        price: 0,
        compareAtPrice: null,
        categoryId: "",
        materialId: null,
        gender: "UNISEX",
        images: [],
        isFeatured: false,
        isArchived: false,
        isPublished: true,
        metaTitle: null,
        metaDescription: null,
        tags: [],
        trackQuantity: true,
        allowBackorder: false,
        variants: [
          {
            sizeId: "",
            colorId: "",
            materialId: null,
            sku: null,
            inventory: 10,
            lowStockThreshold: 10,
            price: null,
          },
        ],
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsLoading(true);
      const endpoint = initialData
        ? `/api/${params.storeId}/products/${params.productId}`
        : `/api/${params.storeId}/products`;
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Something went wrong");

      toast.success(
        initialData ? t("forms.product.updated") : t("forms.product.created")
      );
      router.refresh();
      router.push(`/${params.storeId}/products`);
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/products/${params.productId}`, {
        method: "DELETE",
      });
      toast.success(t("forms.product.deleted"));
      router.push(`/${params.storeId}/products`);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        loading={isLoading}
      />

      <ProductViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        productId={params.productId as string}
        storeId={params.storeId as string}
      />

      <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-white/20 bg-white/10 dark:bg-neutral-900/30 backdrop-blur-xl mb-6">
        <Heading title={title} description={description} />
        <div className="flex items-center gap-2">
          {initialData && (
            <Button
              disabled={isLoading}
              variant="outline"
              size="icon"
              onClick={() => setIsViewOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {initialData && (
            <Button
              disabled={isLoading}
              variant="destructive"
              size="icon"
              onClick={() => setIsOpen(true)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full max-w-5xl mx-auto"
        >
          <div className="flex flex-col gap-8 p-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.product.images")}</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={
                        Array.isArray(field.value)
                          ? field.value.map((image: any) => image?.url || "").filter(Boolean)
                          : []
                      }
                      disabled={isLoading}
                      onChange={(urls) => {
                        const currentValue = Array.isArray(field.value) ? field.value : [];
                        field.onChange([
                          ...currentValue,
                          ...urls.map((url) => ({ url })),
                        ]);
                      }}
                      onRemove={(url) => {
                        const currentValue = Array.isArray(field.value) ? field.value : [];
                        field.onChange(
                          currentValue.filter(
                            (current: any) => current?.url !== url
                          )
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.product.name")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder={t("forms.product.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <PriceField form={form} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.product.category")}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("forms.product.categoryPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.product.material")}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("forms.product.materialPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materials.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.product.gender")}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("forms.product.genderPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["UNISEX", "MEN", "WOMEN", "KIDS"].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.product.descriptionField")}</FormLabel>
                  <FormControl>
                    <Editor {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 rounded-xl p-4 border bg-white/5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("forms.product.isFeatured")}</FormLabel>
                      <FormDescription>
                        {t("forms.product.isFeatured")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isArchived"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 rounded-xl p-4 border bg-white/5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("forms.product.isArchived")}</FormLabel>
                      <FormDescription>
                        {t("forms.product.isArchived")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <Heading
                  title={t("forms.product.variants")}
                  description={t("forms.product.variants")}
                />
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      sizeId: "",
                      colorId: "",
                      materialId: null,
                      sku: null,
                      inventory: 10,
                      lowStockThreshold: 10,
                      price: null,
                    })
                  }
                  variant="secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />{" "}
                  {t("forms.product.addVariant")}
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-4 items-end p-4 border rounded-xl bg-neutral-50 dark:bg-neutral-900/40"
                  >
                    {/* Size */}
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.sizeId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.size")}
                            </FormLabel>
                            <Select
                              disabled={isLoading}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sizes.map((size) => (
                                  <SelectItem key={size.id} value={size.id}>
                                    {size.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Color */}
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.colorId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.color")}
                            </FormLabel>
                            <Select
                              disabled={isLoading}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {colors.map((color) => (
                                  <SelectItem key={color.id} value={color.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-full border"
                                        style={{ backgroundColor: color.value }}
                                      />
                                      {color.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Material */}
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.materialId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.material")} (
                              {t("common.cancel")})
                            </FormLabel>
                            <Select
                              disabled={isLoading}
                              onValueChange={(value) => {
                                field.onChange(
                                  value === "__none__" ? null : value
                                );
                              }}
                              value={field.value || "__none__"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select material" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {materials.map((material) => (
                                  <SelectItem
                                    key={material.id}
                                    value={material.id}
                                  >
                                    {material.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* SKU */}
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.sku")} ({t("common.cancel")})
                            </FormLabel>
                            <FormControl>
                              <Input
                                disabled={isLoading}
                                placeholder="SKU"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Inventory */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.inventory`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.inventory")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                disabled={isLoading}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Low Stock Threshold */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.lowStockThreshold`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.lowStockThreshold")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                disabled={isLoading}
                                value={field.value ?? 10}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Variant Price (Optional) */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              {t("forms.product.variantPrice")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                disabled={isLoading}
                                placeholder="Override price"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              disabled={isLoading}
              className="ml-auto w-full md:w-auto"
              type="submit"
            >
              {action}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
