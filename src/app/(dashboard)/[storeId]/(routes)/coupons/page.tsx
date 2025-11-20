import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { CouponClient } from "./components/client";
import { CouponColumn } from "./components/columns";

const CouponsPage = async (props: { params: Promise<{ storeId: string }> }) => {
  const params = await props.params;

  const coupons = await prisma.coupon.findMany({
    where: { storeId: params.storeId },
    orderBy: { createdAt: "desc" },
  });

  const formattedCoupons: CouponColumn[] = coupons.map((item) => ({
    id: item.id,
    code: item.code,
    type: item.type === "PERCENT" ? "Phần trăm" : "Tiền mặt",
    value: item.type === "PERCENT" ? `${item.value}%` : `${item.value} VND`,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponClient data={formattedCoupons} />
      </div>
    </div>
  );
};

export default CouponsPage;
