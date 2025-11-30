import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { API_MESSAGES, HTTP_STATUS, PAGINATION } from "@/lib/constants";
import { devError } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

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
    const sort = searchParams.get("sort") || undefined;
    const searchQuery =
      searchParams.get("q") || searchParams.get("search") || undefined;
    const page = parseInt(
      searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE)
    );
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT)),
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm cho MongoDB (Prisma MongoDB sử dụng contains không phân biệt hoa thường)
    // Sử dụng Prisma.ProductWhereInput để type-safe với Prisma queries
    let searchConditions: Prisma.ProductWhereInput | undefined = undefined;
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

    // Handle bestseller sort - need to calculate from order items
    if (sort === "bestseller") {
      // Get all orders with order items
      const orders = await prisma.order.findMany({
        where: {
          isPaid: true, // Only count paid orders
        },
        select: {
          orderItems: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      // Calculate total sold quantity per product
      const productSales: Record<string, number> = {};
      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          productSales[item.productId] =
            (productSales[item.productId] || 0) + item.quantity;
        });
      });

      // Get all products first
      const allProducts = await prisma.product.findMany({
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
      });

      // Sort by sold quantity and add sold count
      const productsWithSales = allProducts
        .map((product) => ({
          ...product,
          sold: productSales[product.id] || 0,
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(skip, skip + limit);

      const totalCount = allProducts.length;
      const totalPages = Math.ceil(totalCount / limit);

      // Always return pagination format when page/limit is provided
      const hasPaginationParams =
        searchParams.get("page") || searchParams.get("limit");

      if (!hasPaginationParams && limit === 10) {
        return NextResponse.json(productsWithSales);
      }

      return NextResponse.json({
        products: productsWithSales,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
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
      orderBy:
        sort === "newest"
          ? { createdAt: "desc" }
          : sort === "oldest"
          ? { createdAt: "asc" }
          : { createdAt: "desc" },
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

    // If no pagination params provided, return simple array for backward compatibility
    const hasPaginationParams =
      searchParams.get("page") || searchParams.get("limit");

    if (!hasPaginationParams && limit === 10) {
      // Backward compatibility: return array if no pagination params
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
