"use client";

import { useState, useEffect } from "react";
import { Store } from "@prisma/client";
import { Sidebar } from "./sidebar";

interface SidebarWrapperProps {
  stores: Store[];
}

export function SidebarWrapper({ stores }: SidebarWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  
  useEffect(() => {
    const handleCollapse = () => {
      setCollapsed((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar-collapse", handleCollapse);
    return () =>
      window.removeEventListener("toggle-sidebar-collapse", handleCollapse);
  }, []);

  
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sidebar-collapse-changed", {
        detail: { collapsed },
      })
    );
  }, [collapsed]);

  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Sidebar
      stores={stores}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    />
  );
}
