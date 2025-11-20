import prisma from "@/lib/prisma";
import { CouponForm } from "./components/coupon-form";

const CouponPage = async ({
  params,
}: {
  params: { couponId: string };
}) => {
  const coupon =
    params.couponId === "new"
      ? null
      : await prisma.coupon.findUnique({
          where: {
            id: params.couponId,
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
