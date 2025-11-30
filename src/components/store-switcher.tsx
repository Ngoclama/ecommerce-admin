"use client";

import {
  Check,
  ChevronDown,
  PlusCircle,
  Store as StoreIcon,
} from "lucide-react";
import React, { useState } from "react";
import { Store } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/command";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface StoreSwitcherProps extends PopoverTriggerProps {
  items: Store[];
}

export default function StoreSwitcher({
  className,
  items = [],
}: StoreSwitcherProps) {
  const storeModal = useStoreModal();
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const currentStore = formattedItems.find(
    (item) => item.value === params.storeId
  );

  const onStoreSelect = (store: { label: string; value: string }) => {
    setOpen(false);
    router.push(`/${store.value}`);
  };

  const glassEffect =
    "bg-white/60 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-lg";

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
            "w-[200px] justify-between rounded-2xl h-10 transition-all duration-300",
            glassEffect,
            "hover:bg-white/40 dark:hover:bg-white/10", // Hover effect nhẹ
            "text-neutral-900 dark:text-white font-medium",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="relative h-4 w-4 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain opacity-70"
              />
            </div>
            {currentStore?.label}
          </div>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
              open ? "rotate-180" : ""
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-[200px] p-0 rounded-2xl border-none overflow-hidden mt-2",
          "bg-white/80 dark:bg-black/80 backdrop-blur-2xl backdrop-saturate-150",
          "shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 dark:border-white/10 ring-1 ring-black/5"
        )}
      >
        <Command className="bg-transparent">
          <CommandList>
            <CommandInput
              placeholder="Search store..."
              className="bg-transparent border-none focus:ring-0 text-sm h-11 placeholder:text-neutral-500"
            />
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No store found.
            </CommandEmpty>

            <CommandGroup
              heading="Stores"
              className="text-muted-foreground font-medium px-1"
            >
              {formattedItems.map((store) => (
                <CommandItem
                  key={store.value}
                  onSelect={() => onStoreSelect(store)}
                  className="text-sm rounded-lg aria-selected:bg-black/5 dark:aria-selected:bg-white/15 cursor-pointer py-2.5 px-2 my-1 transition-colors"
                >
                  <StoreIcon className="mr-2 h-4 w-4" />
                  {store.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-primary",
                      currentStore?.value === store.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <CommandSeparator className="bg-neutral-200/50 dark:bg-neutral-700/50" />

          <CommandList>
            <CommandGroup className="px-1 pb-1">
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  storeModal.onOpen();
                }}
                className="text-sm rounded-lg aria-selected:bg-black/5 dark:aria-selected:bg-white/15 cursor-pointer py-2.5 px-2 my-1"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Store
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
