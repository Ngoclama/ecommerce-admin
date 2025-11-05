"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Store {
  id: string;
  name: string;
}

interface ViewAllStoresModalProps {
  stores: Store[];
  isOpen: boolean;
  onClose: () => void;
}

export const ViewAllStoresModal = ({
  stores,
  isOpen,
  onClose,
}: ViewAllStoresModalProps) => {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl w-[90%] max-w-3xl p-6 text-black"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">All Stores</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-black/30 text-black hover:bg-white/20"
              >
                ← Back
              </Button>
            </div>

            {stores.length === 0 ? (
              <p className="text-black-300 text-sm">
                You don’t have any stores yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stores.map((store) => (
                  <motion.div
                    key={store.id}
                    className="border border-black/50 bg-white/10 rounded-xl p-4 backdrop-blur-md shadow-md hover:shadow-lg transition cursor-pointer"
                    whileHover={{ scale: 1.03 }}
                    onClick={() => {
                      onClose();
                      router.push(`/${store.id}`);
                    }}
                  >
                    <h3 className="text-lg font-semibold">{store.name}</h3>

                    <p className="text-xs text-black-300 mt-1">{store.id}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/20 hover:bg-white/30 text-black mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        router.push(`/${store.id}`);
                      }}
                    >
                      Manage
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
