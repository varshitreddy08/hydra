"use client";

import { Bell, User } from "lucide-react";
import type { Profile } from "@/types";

interface Props { profile: Profile; }

export function PlatformHeader({ profile }: Props) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Platform Administration</h1>
        <p className="text-xs text-gray-400">MedResponse Emergency Network</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-700">System Online</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {profile.full_name || "Platform Admin"}
            </p>
            <p className="text-xs text-gray-400">Platform Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
