"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, BarChart3, ScrollText,
  Settings, LogOut, HeartPulse, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/platform",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/platform/hospitals",  label: "Hospitals",   icon: Building2 },
  { href: "/platform/analytics",  label: "Analytics",   icon: BarChart3 },
  { href: "/platform/audit",      label: "Audit Logs",  icon: ScrollText },
  { href: "/platform/settings",   label: "Settings",    icon: Settings },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-16 lg:w-64 flex flex-col bg-white border-r border-gray-200 h-full shrink-0 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-[#1976D2] flex items-center justify-center shrink-0">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-bold text-gray-900 leading-tight">MedResponse</p>
          <p className="text-xs text-gray-400">Emergency Network</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="hidden lg:flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
        <Shield className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Platform Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isExact  = href === "/platform";
          const active   = isExact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#EFF6FF] text-[#1976D2] border border-[#BFDBFE]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
