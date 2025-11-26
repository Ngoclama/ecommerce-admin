import { SizeClient } from "./components/client";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { SizeColumn } from "./components/columns";

const SizePage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;
  const sizes = await prisma.size.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      _count: {
        select: { productVariants: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedSizes: SizeColumn[] = sizes.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    productsCount: item._count.productVariants.toString(),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-neutral-200/70 dark:border-neutral-800/50 p-6 backdrop-blur-xl transition-all">
        <SizeClient data={formattedSizes} />
      </div>
    </div>
  );
};

export default SizePage;
