"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Database, AlertTriangle, GitBranch,
  History, BarChart3, LogOut, HeartPulse, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

const allNavItems = [
  { href: "/hospital",              label: "Dashboard",     icon: LayoutDashboard,  roles: ["hospital_admin","resource_manager","emergency_doctor"] },
  { href: "/hospital/resources",   label: "Resources",     icon: Database,         roles: ["hospital_admin","resource_manager","emergency_doctor"] },
  { href: "/hospital/emergency",   label: "Emergency",     icon: AlertTriangle,    roles: ["hospital_admin","emergency_doctor"] },
  { href: "/hospital/negotiation", label: "AI Negotiation",icon: GitBranch,        roles: ["hospital_admin","emergency_doctor"] },
  { href: "/hospital/history",     label: "History",       icon: History,          roles: ["hospital_admin","resource_manager","emergency_doctor"] },
  { href: "/hospital/analytics",   label: "Analytics",     icon: BarChart3,        roles: ["hospital_admin"] },
  { href: "/hospital/settings",    label: "Settings",      icon: Settings,         roles: ["hospital_admin"] },
];

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  platform_admin:    { label: "Platform Admin",   color: "bg-purple-100 text-purple-700 border-purple-200" },
  hospital_admin:    { label: "Hospital Admin",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  resource_manager:  { label: "Resource Manager", color: "bg-green-100 text-green-700 border-green-200" },
  emergency_doctor:  { label: "Emergency Doctor", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

interface Props { role: UserRole; }

export function HospitalSidebar({ role }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const navItems = allNavItems.filter(item => item.roles.includes(role));
  const rl       = roleLabels[role];

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
          <p className="text-xs text-gray-400">Hospital Portal</p>
        </div>
      </div>

      {/* Role badge */}
      <div className={`hidden lg:flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 rounded-lg border text-xs font-semibold ${rl.color}`}>
        {rl.label}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isExact = href === "/hospital";
          const active  = isExact ? pathname === href : pathname.startsWith(href);
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
