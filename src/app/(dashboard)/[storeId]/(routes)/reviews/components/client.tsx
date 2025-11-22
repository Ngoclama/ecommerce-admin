"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ReviewColumn, columns } from "./columns";

interface ReviewsClientProps {
  data: ReviewColumn[];
}

export const ReviewsClient: React.FC<ReviewsClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Reviews (${data.length})`}
          description="Manage reviews for your products"
        />
      </div>
      <Separator className="my-4" />
      <DataTable searchKey="product" columns={columns} data={data} />
    </>
  );
};
