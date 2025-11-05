import { ColorClient } from "./components/client";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { ColorColumn } from "./components/columns";

const ColorsPage = async ({ params }: { params: { storeId: string } }) => {
  const colors = await prisma.color.findMany({
    where: {
      storeId: params.storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const formattedColors: ColorColumn[] = colors.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    createAt: format(item.createdAt, "MMMM do ,yyyy"),
  }));
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header + Table */}
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-neutral-200/70 dark:border-neutral-800/50 p-6 backdrop-blur-xl transition-all">
        <ColorClient data={formattedColors} />
      </div>
    </div>
  );
};

export default ColorsPage;