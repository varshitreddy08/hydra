"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { statusColor } from "@/lib/utils/formatters";
import { StatusDot } from "@/components/shared/StatusDot";
import { AgentStateBadge } from "@/components/shared/AgentStateBadge";
import { EditResourceDialog } from "@/components/resources/EditResourceDialog";
import type { Resource, ResourceAgent } from "@/types";
import {
  Bed,
  Wind,
  Scan,
  Stethoscope,
  Scissors,
  Syringe,
  Zap,
  Droplets,
  ActivitySquare,
  User,
  Shield,
  FlaskConical,
  Pencil,
} from "lucide-react";
import type { ResourceType } from "@/types";

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  OPERATING_ROOM: <Scissors className="h-5 w-5" />,
  ICU_BED: <Bed className="h-5 w-5" />,
  EMERGENCY_BAY: <Zap className="h-5 w-5" />,
  VENTILATOR: <Wind className="h-5 w-5" />,
  CT_SCANNER: <Scan className="h-5 w-5" />,
  SURGEON: <User className="h-5 w-5" />,
  ANESTHESIOLOGIST: <Syringe className="h-5 w-5" />,
  NURSE_ICU: <Shield className="h-5 w-5" />,
  NURSE_ED: <Shield className="h-5 w-5" />,
  CARDIOLOGIST: <ActivitySquare className="h-5 w-5" />,
  TRAUMA_SURGEON: <Stethoscope className="h-5 w-5" />,
  DEFIBRILLATOR: <Zap className="h-5 w-5" />,
  BLOOD_BANK: <Droplets className="h-5 w-5" />,
};

interface ResourceAgentCardProps {
  resource: Resource;
  agent: ResourceAgent;
}

function UtilizationSparkline({ history }: { history: number[] }) {
  const recent = history.slice(-20);
  if (recent.length === 0) {
    return <div className="text-[10px] text-gray-600">No history</div>;
  }

  const barWidth = 4;
  const gap = 1;
  const height = 20;
  const totalWidth = recent.length * (barWidth + gap) - gap;

  return (
    <svg
      width={totalWidth}
      height={height}
      className="overflow-visible"
      aria-label="Utilization history sparkline"
    >
      {recent.map((val, i) => {
        const barH = val === 1 ? height : height * 0.25;
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barH}
            width={barWidth}
            height={barH}
            rx={1}
            fill={val === 1 ? "#ef4444" : "#1e2d4a"}
          />
        );
      })}
    </svg>
  );
}

export function ResourceAgentCard({ resource, agent }: ResourceAgentCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const icon = RESOURCE_ICONS[resource.type] ?? <FlaskConical className="h-5 w-5" />;

  const allocationRate =
    agent.performanceMetrics.bidsSubmitted > 0
      ? (
          (agent.performanceMetrics.bidsWon / agent.performanceMetrics.bidsSubmitted) *
          100
        ).toFixed(0)
      : "0";

  return (
    <>
    <div className="flex flex-col gap-3 rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-4 transition-all hover:border-[#2a3f5f]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn("shrink-0", statusColor(resource.status))}>{icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{resource.name}</p>
            <p className="text-xs text-gray-500">{resource.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <StatusDot status={resource.status} />
            <span className={cn("text-xs font-medium", statusColor(resource.status))}>
              {resource.status}
            </span>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-lg p-1 text-slate-600 hover:bg-white/10 hover:text-slate-300 transition-colors"
            title="Edit resource"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Agent state */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Agent State</span>
        <AgentStateBadge state={agent.state} />
      </div>

      {/* Capabilities */}
      {resource.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.capabilities.map((cap) => (
            <span
              key={cap}
              className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300"
            >
              {cap.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Performance metrics */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#1e2d4a] bg-white/5 p-2">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-white">
            {agent.performanceMetrics.totalAllocations}
          </span>
          <span className="text-[9px] text-gray-500">Allocations</span>
        </div>
        <div className="flex flex-col items-center border-x border-[#1e2d4a]">
          <span className="text-sm font-bold text-blue-400">
            {agent.performanceMetrics.bidsSubmitted}
          </span>
          <span className="text-[9px] text-gray-500">Bids</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-emerald-400">{allocationRate}%</span>
          <span className="text-[9px] text-gray-500">Win Rate</span>
        </div>
      </div>

      {/* Utilization sparkline */}
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
          Utilization (last 20 ticks)
        </p>
        <UtilizationSparkline history={resource.utilizationHistory} />
      </div>
    </div>

    <EditResourceDialog
      resource={resource}
      open={editOpen}
      onClose={() => setEditOpen(false)}
    />
    </>
  );
}
