"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export function CategoryToolbar() {
  const params = useParams();

  const onBulkCreate = async () => {
    try {
      const response = await fetch(`/api/${params.storeId}/categories/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [
            { name: "Electronics" },
            { name: "Shoes" },
            { name: "Clothing" },
            { name: "Accessories" },
            { name: "Home & Garden" },
          ],
        }),
      });

      if (!response.ok) throw new Error("Tạo thất bại");

      toast.success("✅ Tạo danh mục hàng loạt thành công!");
    } catch (error) {
      toast.error("❌ Lỗi khi tạo danh mục hàng loạt");
    }
  };

  return (
    <div className="flex justify-end mb-4">
      <Button onClick={onBulkCreate} variant="outline">
        + Tạo hàng loạt Category
      </Button>
    </div>
  );
}
