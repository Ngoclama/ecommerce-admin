"use client";

import { useState, useEffect } from "react";
import { Store } from "@prisma/client";
import { Header } from "./header";

interface HeaderWrapperProps {
  stores: Store[];
}

export function HeaderWrapper({ stores }: HeaderWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for collapse state changes
  useEffect(() => {
    const handleCollapseChange = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener(
      "sidebar-collapse-changed",
      handleCollapseChange as EventListener
    );
    return () =>
      window.removeEventListener(
        "sidebar-collapse-changed",
        handleCollapseChange as EventListener
      );
  }, []);

  const handleMenuClick = () => {
    // Dispatch event to toggle sidebar (mobile)
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const handleSidebarToggle = () => {
    // Dispatch event to collapse/expand sidebar (desktop)
    window.dispatchEvent(new CustomEvent("toggle-sidebar-collapse"));
  };

  return (
    <Header
      stores={stores}
      onMenuClick={handleMenuClick}
      onSidebarToggle={handleSidebarToggle}
      sidebarCollapsed={sidebarCollapsed}
    />
  );
}
