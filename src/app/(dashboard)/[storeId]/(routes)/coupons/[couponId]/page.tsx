import prisma from "@/lib/prisma";
import { CouponForm } from "./components/coupon-form";

const CouponPage = async ({
  params,
}: {
  params: Promise<{ storeId: string; couponId: string }>;
}) => {
  const { storeId, couponId } = await params;
  const coupon =
    couponId === "new"
      ? null
      : await prisma.coupon.findFirst({
          where: {
            id: couponId,
            storeId: storeId,
          },
        });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponForm initialData={coupon} />
      </div>
    </div>
  );
};

export default CouponPage;
