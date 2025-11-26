import prisma from "@/lib/prisma";
import { ObjectId } from "bson";

const ReviewPage = async ({
  params,
}: {
  params: Promise<{ reviewId: string; storeId: string }>;
}) => {
  const { reviewId, storeId } = await params;
  const isValidId = ObjectId.isValid(reviewId);

  const review = isValidId
    ? await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          product: true,
          user: true,
        },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Review Details</h1>
          {review ? (
            <div className="space-y-2">
              <p>
                <strong>Product:</strong> {review.product.name}
              </p>
              <p>
                <strong>User:</strong> {review.user.name || review.user.email}
              </p>
              <p>
                <strong>Rating:</strong> {review.rating}/5
              </p>
              <p>
                <strong>Content:</strong> {review.content || "No content"}
              </p>
            </div>
          ) : (
            <p>Review not found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
