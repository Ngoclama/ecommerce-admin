"use client";
import { Button } from "@/components/ui/button";
import { useStoreModal } from "../../../hooks/use-store-modal";
import { useEffect } from "react";

const SetUpPage = () => {
  const isOpen = useStoreModal((state) => state.isOpen);
  console.log(isOpen);
  const onOpen = useStoreModal((state) => state.onOpen);
  useEffect(() => {
    if (!isOpen) onOpen();
  }, [onOpen, isOpen]);

  return null;
};
export default SetUpPage;
