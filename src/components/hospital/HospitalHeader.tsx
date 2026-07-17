"use client";

import { Bell, User, Building2 } from "lucide-react";
import type { Profile } from "@/types";

interface Props { profile: Profile; }

const roleLabels: Record<string, string> = {
  hospital_admin:   "Hospital Administrator",
  resource_manager: "Resource Manager",
  emergency_doctor: "Emergency Doctor",
};

export function HospitalHeader({ profile }: Props) {
  const hospital = profile.hospital as { name?: string } | null | undefined;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        {hospital?.name && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">{hospital.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Emergency alert indicator */}
        <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-700">Online</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {profile.full_name || profile.email || "User"}
            </p>
            <p className="text-xs text-gray-400">
              {roleLabels[profile.role] || profile.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
