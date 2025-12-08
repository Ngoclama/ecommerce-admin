"use client";

import { useState, useEffect } from "react";
import { Store } from "@prisma/client";
import { Header } from "./header";

interface HeaderWrapperProps {
  stores: Store[];
}

export function HeaderWrapper({ stores }: HeaderWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  
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
    
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const handleSidebarToggle = () => {
    
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
