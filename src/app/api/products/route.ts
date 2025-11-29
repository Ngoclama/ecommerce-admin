import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả sản phẩm (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");
    const searchQuery =
      searchParams.get("q") || searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search conditions for MongoDB (Prisma MongoDB uses contains with case-insensitive)
    let searchConditions: any = undefined;
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      // Escape special regex characters
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      searchConditions = {
        OR: [
          {
            name: {
              contains: escapedTerm,
            },
          },
          {
            description: {
              contains: escapedTerm,
            },
          },
          {
            slug: {
              contains: escapedTerm,
            },
          },
          {
            variants: {
              some: {
                OR: [
                  {
                    sku: {
                      contains: escapedTerm,
                    },
                  },
                  {
                    size: {
                      OR: [
                        {
                          name: {
                            contains: escapedTerm,
                          },
                        },
                        {
                          value: {
                            contains: escapedTerm,
                          },
                        },
                      ],
                    },
                  },
                  {
                    color: {
                      OR: [
                        {
                          name: {
                            contains: escapedTerm,
                          },
                        },
                        {
                          value: {
                            contains: escapedTerm,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
          {
            category: {
              OR: [
                {
                  name: {
                    contains: escapedTerm,
                  },
                },
                {
                  slug: {
                    contains: escapedTerm,
                  },
                },
              ],
            },
          },
        ],
      };
    }

    // Tối ưu: chỉ select các field cần thiết
    const products = await prisma.product.findMany({
      where: {
        ...(searchConditions && searchConditions),
        categoryId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
        isPublished: true, // Chỉ lấy sản phẩm đã publish
        variants:
          sizeId || colorId
            ? {
                some: {
                  sizeId: sizeId || undefined,
                  colorId: colorId || undefined,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        description: true,
        isFeatured: true,
        isArchived: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: {
            id: true,
            url: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            inventory: true,
            price: true,
            size: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
            material: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: {
        ...(searchConditions && searchConditions),
        categoryId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
        isPublished: true,
        variants:
          sizeId || colorId
            ? {
                some: {
                  sizeId: sizeId || undefined,
                  colorId: colorId || undefined,
                },
              }
            : undefined,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    // If no pagination params provided and no search query, return simple array for backward compatibility
    const hasPaginationParams =
      searchParams.get("page") || searchParams.get("limit");
    const hasSearchQuery = searchQuery && searchQuery.trim();

    if (!hasPaginationParams && !hasSearchQuery && limit === 10) {
      // Backward compatibility: return array if no pagination/search params
      return NextResponse.json(products);
    }

    // Return pagination format for search or when pagination params are provided
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PRODUCTS_PUBLIC_GET]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
