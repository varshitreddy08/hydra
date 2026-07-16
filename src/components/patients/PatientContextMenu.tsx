"use client";

import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  Building2,
  Trash2,
  Loader2,
  Zap,
  Link2,
} from "lucide-react";
import type { Patient } from "@/types";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface PatientContextMenuProps {
  patient: Patient;
  position: ContextMenuPosition;
  onClose: () => void;
  onAllocate: () => void;
  onWhichHospital: () => void;
  onAttachHospital: () => void;
  onDiscard: () => void;
  allocating: boolean;
}

export function PatientContextMenu({
  patient,
  position,
  onClose,
  onAllocate,
  onWhichHospital,
  onAttachHospital,
  onDiscard,
  allocating,
}: PatientContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust so menu stays inside viewport
  const menuWidth = 220;
  const menuHeight = 230;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 8);

  const canAllocate =
    patient.status === "WAITING" || patient.status === "IN_NEGOTIATION";
  const canSeeHospital =
    patient.status === "ALLOCATED" ||
    patient.status === "IN_TREATMENT" ||
    patient.allocatedResources.length > 0;

  return (
    <div
      ref={ref}
      className="fixed z-[200] min-w-[220px] overflow-hidden rounded-xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl"
      style={{ top: y, left: x }}
    >
      {/* Patient info header */}
      <div className="border-b border-[#1e2d4a] bg-[#080c18] px-3 py-2.5">
        <p className="text-xs font-bold text-white">{patient.mrn}</p>
        <p className="text-[10px] text-slate-500">
          {patient.condition.replace(/_/g, " ")} · {patient.age}y {patient.sex}
        </p>
      </div>

      <div className="p-1.5 space-y-0.5">
        {/* Allocate */}
        <MenuItem
          icon={allocating ? Loader2 : Zap}
          label={allocating ? "Allocating…" : "Allocate Now"}
          description="Run negotiation immediately"
          onClick={() => { onAllocate(); onClose(); }}
          disabled={!canAllocate || allocating}
          iconCls={canAllocate ? "text-blue-400" : "text-slate-600"}
          spin={allocating}
        />

        {/* Attach to Hospital */}
        <MenuItem
          icon={Link2}
          label="Attach to Hospital"
          description="Manually pick a hospital for this patient"
          onClick={() => { onAttachHospital(); onClose(); }}
          disabled={!canAllocate || allocating}
          iconCls={canAllocate ? "text-violet-400" : "text-slate-600"}
        />

        {/* Which Hospital */}
        <MenuItem
          icon={Building2}
          label="Which Hospital"
          description="See assigned hospital & resources"
          onClick={() => { onWhichHospital(); onClose(); }}
          disabled={!canSeeHospital}
          iconCls={canSeeHospital ? "text-emerald-400" : "text-slate-600"}
        />

        <div className="my-1 border-t border-[#1e2d4a]" />

        {/* Discard */}
        <MenuItem
          icon={Trash2}
          label="Discard Case"
          description="Close case and discharge patient"
          onClick={() => { onDiscard(); onClose(); }}
          disabled={patient.status === "DISCHARGED"}
          iconCls="text-red-400"
          danger
        />
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  description,
  onClick,
  disabled,
  iconCls,
  danger,
  spin,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  iconCls?: string;
  danger?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-35 ${
        danger
          ? "hover:bg-red-500/10 disabled:hover:bg-transparent"
          : "hover:bg-white/6 disabled:hover:bg-transparent"
      }`}
    >
      <Icon
        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconCls} ${spin ? "animate-spin" : ""}`}
      />
      <div>
        <p className={`text-xs font-medium ${danger ? "text-red-400" : "text-slate-200"} leading-tight`}>
          {label}
        </p>
        <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{description}</p>
      </div>
    </button>
  );
}
