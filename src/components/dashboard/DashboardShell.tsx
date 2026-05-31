"use client";

import { createContext, useContext, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const SidebarCtx = createContext({ open: false, toggle: () => {}, close: () => {} });
export const useSidebar = () => useContext(SidebarCtx);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  const close  = () => setOpen(false);

  return (
    <SidebarCtx.Provider value={{ open, toggle, close }}>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
          <Topbar />
          <main className="flex-1">
            <div className="dashboard-content">{children}</div>
          </main>
        </div>
      </div>
    </SidebarCtx.Provider>
  );
}
