"use client";

import { useEffect } from "react";

export function SidebarToggleScript() {
  useEffect(() => {
    
    const updateContentPadding = () => {
      const sidebar = document.querySelector('aside');
      const mainContent = document.getElementById('main-content');
      if (sidebar && mainContent) {
        const isCollapsed = sidebar.classList.contains('w-20');
        if (window.innerWidth >= 1024) {
          mainContent.style.paddingLeft = isCollapsed ? '5rem' : '16rem';
        } else {
          mainContent.style.paddingLeft = '0';
        }
      }
    };

    
    updateContentPadding();

    
    const observer = new MutationObserver(updateContentPadding);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    
    window.addEventListener('resize', updateContentPadding);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateContentPadding);
    };
  }, []);

  return null;
}

