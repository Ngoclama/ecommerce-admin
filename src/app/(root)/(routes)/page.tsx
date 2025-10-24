"use client";
import { Button } from "@/components/ui/button";
import { useStoreModal } from "../../../hooks/use-store-modal";
import { useEffect } from "react";

const SetUpPage = () => {
  const isOpen = useStoreModal((state) => state.isOpen);
  const onOpen = useStoreModal((state) => state.onOpen);
  useEffect(() => {
    if (!isOpen) onOpen();
  }, [onOpen, isOpen]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button variant="secondary" size="lg">
        Set up your store
      </Button>
    </div>
  );
};
export default SetUpPage;
