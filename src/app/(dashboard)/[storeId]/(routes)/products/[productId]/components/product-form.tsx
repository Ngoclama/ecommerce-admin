"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { NumericFormat } from "react-number-format";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash, Eye } from "lucide-react";
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
} from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "Product label is required"),
  images: z
    .array(z.object({ url: z.string() }))
    .min(1, "At least one image is required"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Price must be greater than or equal to 0")
  ),
  inventory: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Inventory must be 0 or more")
  ),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  sizeId: z.string().min(1, "Size is required"),
  colorId: z.string().min(1, "Color is required"),
  materialId: z.string().optional(),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]).default("UNISEX"),
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
});

export type ProductFormValues = z.infer<typeof formSchema>;

interface PriceFieldProps {
  form: any;
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
          <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Price
          </FormLabel>
          <FormControl>
            <NumericFormat
              value={field.value ?? ""}
              thousandSeparator={currency === "VND" ? "." : ","}
              decimalSeparator={currency === "VND" ? "," : "."}
              decimalScale={currency === "USD" ? 2 : 0}
              allowNegative={false}
              fixedDecimalScale={false}
              suffix={` ${currencySymbol}`}
              placeholder={placeholderText}
              disabled={isLoading}
              className="
                w-full px-4 py-3 text-sm font-medium
                rounded-2xl border border-white/30 dark:border-white/10
                bg-white/10 dark:bg-neutral-900/20
                backdrop-blur-md backdrop-saturate-150
                shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
                placeholder:text-neutral-500 dark:placeholder:text-neutral-400
                text-neutral-800 dark:text-neutral-100
                focus-visible:ring-2 focus-visible:ring-blue-400/50
                focus-visible:border-blue-400/50
                outline-none transition-all duration-300 ease-in-out
              "
              onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
            />
          </FormControl>
          <FormMessage className="text-xs text-red-500" />
        </FormItem>
      )}
    />
  );
};

interface ProductFormProps {
  initialData:
    | (Product & {
        images: Image[];
      })
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
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? "Edit Product" : "Create Product";
  const description = initialData ? "Edit your Product" : "Add a new Product";
  const action = initialData ? "Save changes" : "Create";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          name: initialData.name ?? "",
          description: initialData.description ?? "",
          price: Number(initialData.price) || 0,
          categoryId: initialData.categoryId ?? "",
          sizeId: initialData.sizeId ?? "",
          colorId: initialData.colorId ?? "",
          inventory: initialData.inventory ?? 10,
          materialId: initialData.materialId ?? "",
          gender:
            (initialData.gender as "MEN" | "WOMEN" | "KIDS" | "UNISEX") ??
            "UNISEX",
          images: initialData.images?.map((i) => ({ url: i.url })) ?? [],
          isFeatured: initialData.isFeatured ?? false,
          isArchived: initialData.isArchived ?? false,
        }
      : {
          name: "",
          description: "",
          price: 0,
          inventory: 10,
          categoryId: "",
          sizeId: "",
          colorId: "",
          materialId: "",
          gender: "UNISEX",
          images: [],
          isFeatured: false,
          isArchived: false,
        },
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

      if (!res.ok)
        throw new Error(
          initialData ? "Failed to update product" : "Failed to create product"
        );

      toast.success(initialData ? "Product updated!" : "Product created!");
      router.refresh();
      router.push(`/${params.storeId}/products`);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("[onSubmit Product]", error);
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
      toast.success("Product deleted successfully");
      router.push(`/${params.storeId}/products`);
      router.refresh();
    } catch (error) {
      toast.error("Make sure you removed all products and categories first.");
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

      <div
        className="flex items-center justify-between px-6 py-4 
                rounded-2xl border border-white/20 dark:border-white/10 
                bg-white/10 dark:bg-neutral-900/30 
                backdrop-blur-xl backdrop-saturate-150
                shadow-[0_8px_32px_rgba(0,0,0,0.15)] 
                transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
      >
        <Heading title={title} description={description} />

        <div className="flex items-center gap-2">
          {initialData && (
            <Button
              disabled={isLoading}
              variant="outline"
              size="icon"
              onClick={() => setIsViewOpen(true)}
              className="rounded-xl backdrop-blur-md bg-white/20 hover:bg-white/30 shadow-sm hover:scale-105 transition-all"
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}

          {initialData && (
            <Button
              disabled={isLoading}
              variant="destructive"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="rounded-xl backdrop-blur-md bg-red-500/80 hover:bg-red-600/90 text-white shadow-lg hover:scale-105 transition-all"
            >
              <Trash className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-6 opacity-60" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-8 rounded-3xl border border-white/20 dark:border-white/10 
                      bg-white/10 dark:bg-neutral-900/30
                      backdrop-blur-2xl backdrop-saturate-150
                      shadow-[0_8px_32px_rgba(0,0,0,0.2)]
                      p-8 transition-all hover:shadow-[0_12px_48px_rgba(0,0,0,0.3)]"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product name..."
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceField form={form} isLoading={isLoading} currency="VND" />

              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold">
                      Inventory
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isLoading}
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="bg-white/10 dark:bg-neutral-900/20 rounded-2xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
                name="sizeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a size" />
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

              <FormField
                control={form.control}
                name="colorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.id} value={color.id}>
                            {color.name}
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
                    <FormLabel>Material (Optional)</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materials.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name}
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
                    <FormLabel>Gender</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNISEX">Unisex</SelectItem>
                        <SelectItem value="MEN">Men</SelectItem>
                        <SelectItem value="WOMEN">Women</SelectItem>
                        <SelectItem value="KIDS">Kids</SelectItem>
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
                <FormItem className="space-y-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Editor
                      placeholder="Write something engaging about this product..."
                      minRows={3}
                      maxRows={8}
                      disabled={isLoading}
                      className="
                        w-full px-4 py-3 text-sm resize-none
                        bg-white/10 dark:bg-neutral-900/20
                        backdrop-blur-md border border-white/20 dark:border-neutral-800/40
                        rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
                        placeholder:text-neutral-400
                        focus-visible:ring-2 focus-visible:ring-blue-500/40
                        focus-visible:border-blue-500/40
                        transition-all duration-300 ease-in-out
                      "
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 rounded-xl p-4 border border-white/20 dark:border-neutral-800/40 bg-white/5 dark:bg-neutral-900/20 backdrop-blur-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Featured
                      </FormLabel>
                      <FormDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                        This product will appear on the home page
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isArchived"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 rounded-xl p-4 border border-white/20 dark:border-neutral-800/40 bg-white/5 dark:bg-neutral-900/20 backdrop-blur-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Archived
                      </FormLabel>
                      <FormDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                        This product will not appear anywhere in the store
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value.map((image) => image.url)}
                      disabled={isLoading}
                      onChange={(urls) => {
                        const newImages = urls.map((url) => ({ url }));
                        field.onChange([...field.value, ...newImages]);
                      }}
                      onRemove={(url) =>
                        field.onChange(
                          field.value.filter((current) => current.url !== url)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  disabled={isLoading}
                  type="submit"
                  variant="outline"
                  className="rounded-xl text-black 
                           backdrop-blur-md backdrop-saturate-150 
                           shadow-lg hover:shadow-white-500/30 transition-all"
                >
                  {isLoading ? "Processing..." : action}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </form>
      </Form>
    </>
  );
};
