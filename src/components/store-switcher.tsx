"use client";
import {
  Check,
  ChevronDown,
  PlusCircle,
  Store as StoreIcon,
} from "lucide-react";
import React, { useState } from "react";
import { Store } from "@/generated/prisma";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ViewAllStoresModal } from "@/components/modals/view-all-stores";

import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useStoreModal } from "@/hooks/use-store-modal";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;
interface StoreSwitcherProps extends PopoverTriggerProps {
  items: Store[];
}

function GlassStoreSwitcher({
  formattedItems,
  currentStore,
  onStoreSelect,
  storeModel,
  className,
  onViewAllStores,
}: any) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a store"
          className={cn(
            "w-[220px] justify-between rounded-xl font-medium",
            "bg-white/10 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/20 dark:border-white/10",
            "shadow-[0_4px_30px_rgba(0,0,0,0.1)] text-black hover:bg-white/20 dark:hover:bg-white/10",
            "transition-all duration-300 ",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 opacity-80" />
            {currentStore?.label || "Select a store"}
          </div>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>

      <AnimatePresence>
        {open && (
          <PopoverContent asChild sideOffset={6} align="start">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "w-[220px] p-0 overflow-hidden rounded-2xl backdrop-blur-2xl",
                "bg-white/15 dark:bg-neutral-800/40 border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
              )}
            >
              <Command>
                <CommandInput
                  placeholder="Search store..."
                  className="bg-transparent border-b border-white/10 placeholder:text-black/60 text-black/80"
                />
                <CommandList className="max-h-[220px] overflow-y-auto">
                  <CommandEmpty className="text-black/70 p-3 text-center">
                    No store found.
                  </CommandEmpty>

                  <CommandGroup heading="Stores" className="text-black/80">
                    {formattedItems.map((store: any) => (
                      <CommandItem
                        key={store.value}
                        onSelect={() => onStoreSelect(store)}
                        className="flex items-center gap-2 text-sm text-black/80 hover:bg-white/20 transition-all rounded-md"
                      >
                        <StoreIcon className="h-4 w-4 opacity-80" />
                        {store.label}
                        {currentStore?.value === store.value && (
                          <Check className="ml-auto h-4 w-4 text-black" />
                        )}
                      </CommandItem>
                    ))}
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        storeModel.onOpen();
                      }}
                      className="text-black/80 hover:bg-white/20 rounded-md transition-all"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />+ Create Store
                    </CommandItem>
                  </CommandGroup>
                </CommandList>

                <CommandSeparator className="bg-black/20" />

                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        onViewAllStores();
                      }}
                      className="text-black/80 hover:bg-white/20 rounded-md transition-all"
                    >
                      <StoreIcon className="mr-2 h-4 w-4 opacity-80" />
                      View All Stores
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  );
}

export default function StoreSwitcher({
  className,
  items = [],
}: StoreSwitcherProps) {
  const storeModel = useStoreModal();
  const params = useParams();
  const router = useRouter();

  const [showStoresModal, setShowStoresModal] = useState(false);

  const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const currentStore = formattedItems.find(
    (item) => item.value === params.storeId
  );

  const onStoreSelect = (store: { label: string; value: string }) => {
    router.push(`/${store.value}`);
  };

  return (
    <>
      <GlassStoreSwitcher
        formattedItems={formattedItems}
        currentStore={currentStore}
        onStoreSelect={onStoreSelect}
        storeModel={storeModel}
        className={className}
        onViewAllStores={() => setShowStoresModal(true)} // ✅ truyền callback
      />

      <ViewAllStoresModal
        stores={formattedItems.map((s: any) => ({
          id: s.value,
          name: s.label,
        }))}
        isOpen={showStoresModal}
        onClose={() => setShowStoresModal(false)}
      />
    </>
  );
}
