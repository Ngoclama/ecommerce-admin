import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { ReviewsClient } from "./components/client";
import { ReviewColumn } from "./components/columns";

const ReviewsPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const reviews = await prisma.review.findMany({
    where: {
      product: {
        storeId: storeId,
      },
    },
    include: {
      product: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedReviews: ReviewColumn[] = reviews.map((item) => ({
    id: item.id,
    product: item.product.name,
    user: item.user.name || item.user.email || "Anonymous",
    rating: item.rating,
    content: item.content || "",
    imageUrl: item.imageUrls?.[0] || "",
    isArchived: item.isArchived,
    adminResponse: item.adminResponse,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReviewsClient data={formattedReviews} />
      </div>
    </div>
  );
};

export default ReviewsPage;
