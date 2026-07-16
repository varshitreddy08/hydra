export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function formatWaitTime(arrivedAt: number): string {
  const ms = Date.now() - arrivedAt;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCondition(condition: string): string {
  return condition.replace(/_/g, " ");
}

export function triageLevelColor(level: string): string {
  const map: Record<string, string> = {
    P1_IMMEDIATE: "text-red-400",
    P2_EMERGENT: "text-orange-400",
    P3_URGENT: "text-yellow-400",
    P4_LESS_URGENT: "text-blue-400",
    P5_NON_URGENT: "text-green-400",
  };
  return map[level] ?? "text-gray-400";
}

export function triageLevelBg(level: string): string {
  const map: Record<string, string> = {
    P1_IMMEDIATE: "bg-red-500/20 border-red-500/40 text-red-300",
    P2_EMERGENT: "bg-orange-500/20 border-orange-500/40 text-orange-300",
    P3_URGENT: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    P4_LESS_URGENT: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    P5_NON_URGENT: "bg-green-500/20 border-green-500/40 text-green-300",
  };
  return (
    map[level] ?? "bg-gray-500/20 border-gray-500/40 text-gray-300"
  );
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "text-emerald-400",
    OCCUPIED: "text-red-400",
    RESERVED: "text-amber-400",
    MAINTENANCE: "text-orange-400",
    OFFLINE: "text-gray-500",
  };
  return map[status] ?? "text-gray-400";
}

export function statusDotColor(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "bg-emerald-400",
    OCCUPIED: "bg-red-400",
    RESERVED: "bg-amber-400",
    MAINTENANCE: "bg-orange-400",
    OFFLINE: "bg-gray-500",
  };
  return map[status] ?? "bg-gray-400";
}

export function agentStateColor(state: string): string {
  const map: Record<string, string> = {
    IDLE: "bg-gray-500/20 text-gray-300 border-gray-500/40",
    LISTENING: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    BIDDING: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    BID_ACCEPTED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    BID_REJECTED: "bg-red-500/20 text-red-300 border-red-500/40",
    ALLOCATED: "bg-blue-600/20 text-blue-200 border-blue-500/40",
    RELEASING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    MAINTENANCE: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    BLOCKED: "bg-red-900/30 text-red-400 border-red-700/40",
  };
  return map[state] ?? "bg-gray-500/20 text-gray-300 border-gray-500/40";
}
