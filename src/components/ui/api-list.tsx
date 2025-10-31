"use client";

import { useParams } from "next/navigation";
import { ApiAlert } from "@/components/ui/api-alert";
import { useOrigin } from "@/hooks/use-origin";

interface ApiListProps {
  entityName: string;
  entityIdName: string;
}
export const ApiList: React.FC<ApiListProps> = ({
  entityName,
  entityIdName,
}) => {
  const params = useParams();
  const origin = useOrigin();

  const baseURL = `${origin}/api/${params.storeId}`;

  return (
    <div>
      <>
        <ApiAlert
          title="GET"
          variant="public"
          description={`${baseURL}/${entityName}`}
        ></ApiAlert>
        <ApiAlert
          title="GET"
          variant="public"
          description={`${baseURL}/${entityName}/{${entityIdName}}`}
        ></ApiAlert>
        <ApiAlert
          title="POST"
          variant="admin"
          description={`${baseURL}/${entityName}`}
        ></ApiAlert>
        <ApiAlert
          title="PATCH"
          variant="admin"
          description={`${baseURL}/${entityName}/{${entityIdName}}`}
        ></ApiAlert>
        <ApiAlert
          title="DELETE"
          variant="admin"
          description={`${baseURL}/${entityName}/{${entityIdName}}`}
        ></ApiAlert>
      </>
    </div>
  );
};
