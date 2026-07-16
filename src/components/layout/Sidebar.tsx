"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  GitBranch,
  Users,
  Database,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/negotiation", label: "Negotiation", icon: GitBranch },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/resources", label: "Resources", icon: Database },
  { href: "/decisions", label: "Decisions", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-16 lg:w-60 flex flex-col bg-[#0d1526] border-r border-[#1e2d4a] h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e2d4a]">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-red-400" />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-bold text-white leading-tight">MedNegotiate</p>
          <p className="text-xs text-slate-500">Emergency Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:bg-[#1c2a42] hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-[#1e2d4a]">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
