import React from "react";
import { BillboardClient } from "./components/client";

const Billboard = () => {
  return (
    <div className="flex col">
      <div className="flex-1 pt-6 space-y-4 p-8">
        <BillboardClient></BillboardClient>
      </div>
    </div>
  );
};

export default Billboard;
