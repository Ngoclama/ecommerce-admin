import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";
import { API_MESSAGES, HTTP_STATUS, DEFAULTS } from "@/lib/constants";
import { devLog, devError } from "@/lib/api-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    if (!storeId) {
      return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    const body = await req.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new NextResponse("Invalid data: products array is required", {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ index: number; message: string }> = [];

    // Process products in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (product: any, batchIndex: number) => {
          const globalIndex = i + batchIndex;
          try {
            // Validate required fields
            if (!product.name) {
              throw new Error("Name is required");
            }
            if (!product.price || isNaN(Number(product.price))) {
              throw new Error("Valid price is required");
            }
            if (!product.description) {
              throw new Error("Description is required");
            }
            if (!product.categoryId) {
              throw new Error("Category ID is required");
            }
            if (!product.gender) {
              throw new Error("Gender is required");
            }
            if (
              !product.variants ||
              !Array.isArray(product.variants) ||
              product.variants.length === 0
            ) {
              throw new Error("At least one variant is required");
            }

            // Validate variants
            for (const variant of product.variants) {
              if (!variant.sizeId) {
                throw new Error("Variant sizeId is required");
              }
              if (!variant.colorId) {
                throw new Error("Variant colorId is required");
              }
              if (
                variant.inventory === undefined ||
                isNaN(Number(variant.inventory))
              ) {
                throw new Error("Variant inventory is required");
              }
            }

            // Generate slug
            let slug = slugify(product.name, { lower: true, strict: true });
            const existingProduct = await prisma.product.findUnique({
              where: {
                storeId_slug: {
                  storeId: storeId,
                  slug: slug,
                },
              },
            });

            if (existingProduct) {
              slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
            }

            // Create product with variants and images
            await prisma.product.create({
              data: {
                name: product.name,
                slug: slug,
                price: Number(product.price),
                compareAtPrice: product.compareAtPrice
                  ? Number(product.compareAtPrice)
                  : null,
                description: product.description,
                isFeatured: product.isFeatured ?? false,
                isArchived: product.isArchived ?? false,
                isPublished: product.isPublished ?? true,
                categoryId: product.categoryId,
                materialId: product.materialId || null,
                gender: product.gender || DEFAULTS.GENDER,
                metaTitle: product.metaTitle || null,
                metaDescription: product.metaDescription || null,
                tags: product.tags || [],
                trackQuantity:
                  product.trackQuantity !== undefined
                    ? product.trackQuantity
                    : DEFAULTS.TRACK_QUANTITY,
                allowBackorder:
                  product.allowBackorder !== undefined
                    ? product.allowBackorder
                    : DEFAULTS.ALLOW_BACKORDER,
                storeId: storeId,
                images: {
                  createMany: {
                    data:
                      product.images && Array.isArray(product.images)
                        ? product.images.map((img: { url: string }) => ({
                            url: img.url,
                          }))
                        : [],
                  },
                },
                variants: {
                  createMany: {
                    data: product.variants.map((v: any) => ({
                      sizeId: v.sizeId,
                      colorId: v.colorId,
                      materialId: v.materialId || null,
                      sku: v.sku || null,
                      inventory: Number(v.inventory),
                      lowStockThreshold:
                        Number(v.lowStockThreshold) ||
                        DEFAULTS.LOW_STOCK_THRESHOLD,
                      price: v.price ? Number(v.price) : null,
                    })),
                  },
                },
              },
            });

            successCount++;
          } catch (error: any) {
            errorCount++;
            errors.push({
              index: globalIndex,
              message: error.message || "Unknown error",
            });
            devError(
              `[BULK_IMPORT] Error importing product at index ${globalIndex}:`,
              error
            );
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errorCount > 0 ? errors : undefined,
      total: products.length,
    });
  } catch (error) {
    devError("[PRODUCTS_BULK_IMPORT]", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

