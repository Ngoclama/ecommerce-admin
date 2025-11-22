"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, Store as StoreIcon, X } from "lucide-react"; // Thêm icon X
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  // Lấy storeId hiện tại từ path (ví dụ: /store_id/products -> store_id)
  const currentStoreId = pathname.split("/")[1] || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-white/10 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/20 dark:border-neutral-700/50 rounded-3xl shadow-2xl w-[90%] max-w-3xl p-6 text-white dark:text-neutral-100 max-h-[80vh] overflow-y-auto"
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-white/10 dark:border-neutral-700 pb-4 sticky top-0 bg-white/0 dark:bg-neutral-900/0 z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <StoreIcon className="w-6 h-6 text-primary" /> All Stores
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            {stores.length === 0 ? (
              <p className="text-neutral-500 text-sm py-4 text-center">
                You don’t have any stores yet. Create one now!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {stores.map((store) => {
                  const isActive = store.id === currentStoreId;

                  return (
                    <motion.div
                      key={store.id}
                      className={cn(
                        "relative border rounded-xl p-4 backdrop-blur-md shadow-md cursor-pointer transition-all duration-200",
                        "text-neutral-900 dark:text-neutral-100", // Default text color
                        isActive
                          ? "border-primary-light bg-primary/10 shadow-primary/20" // Active style
                          : "border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/40" // Inactive style
                      )}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        onClose();
                        router.push(`/${store.id}`);
                      }}
                    >
                      {/* Check Icon */}
                      {isActive && (
                        <div className="absolute top-3 right-3 text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}

                      <h3 className="text-lg font-semibold truncate">
                        {store.name}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        ID: {store.id.slice(0, 10)}...
                      </p>

                      <Button
                        size="sm"
                        variant={isActive ? "default" : "secondary"}
                        className={cn(
                          "mt-3 text-sm font-semibold rounded-lg transition-colors w-full",
                          isActive
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          router.push(`/${store.id}`);
                        }}
                      >
                        {isActive ? "Current Store" : "Manage Store"}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
