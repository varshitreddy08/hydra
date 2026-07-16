"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { LocationBootstrap } from "./LocationBootstrap";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c18" }}>
      <LocationBootstrap />
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
