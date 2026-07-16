"use client";

import { Users, Activity, Clock, CheckCircle } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils/cn";
import { formatMs } from "@/lib/utils/formatters";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent?: string;
}

function KPICard({ icon, label, children, accent }: KPICardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-[#111b2e] p-4 transition-colors",
        accent ?? "border-[#1e2d4a]"
      )}
    >
      <div className="flex items-center gap-2 text-gray-400">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

export function KPICards() {
  const patients = useSimulationStore((s) => s.patients);
  const resources = useSimulationStore((s) => s.resources);
  const getMetrics = useSimulationStore((s) => s.getMetrics);

  const metrics = getMetrics();

  const activePatients = patients.filter((p) => p.status !== "DISCHARGED").length;
  const occupiedCount = resources.filter((r) => r.status === "OCCUPIED").length;
  const utilizationPct =
    resources.length > 0 ? Math.round((occupiedCount / resources.length) * 100) : 0;

  const utilizationAccent =
    utilizationPct > 80
      ? "border-red-500/40"
      : utilizationPct < 50
      ? "border-emerald-500/40"
      : "border-[#1e2d4a]";

  const utilizationValueColor =
    utilizationPct > 80
      ? "text-red-400"
      : utilizationPct < 50
      ? "text-emerald-400"
      : "text-white";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard icon={<Users />} label="Active Patients">
        <div className="text-3xl font-bold text-white">
          <AnimatedCounter value={activePatients} />
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {patients.filter((p) => p.status === "WAITING").length} waiting
        </p>
      </KPICard>

      <KPICard icon={<Activity />} label="Resource Utilization" accent={utilizationAccent}>
        <div className={cn("text-3xl font-bold tabular-nums", utilizationValueColor)}>
          <AnimatedCounter value={utilizationPct} />
          <span className="text-xl">%</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {occupiedCount} / {resources.length} occupied
        </p>
      </KPICard>

      <KPICard icon={<Clock />} label="Avg Decision Time">
        <div className="text-3xl font-bold text-blue-400">
          {formatMs(metrics.avgDecisionTimeMs)}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">per negotiation round</p>
      </KPICard>

      <KPICard icon={<CheckCircle />} label="Allocations Made">
        <div className="text-3xl font-bold text-emerald-400">
          <AnimatedCounter value={metrics.totalAllocations} />
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {metrics.totalFailed} failed
        </p>
      </KPICard>
    </div>
  );
}
