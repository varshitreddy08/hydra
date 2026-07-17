"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  requests: { severity: string; status: string; created_at: string }[];
  negotiations: { status: string; overall_score: number | null; started_at: string }[];
  resources: { type: string; status: string }[];
}

const COLORS = ["#22C55E","#F59E0B","#EF4444","#1976D2","#7C3AED"];

export function AnalyticsClient({ requests, negotiations, resources }: Props) {
  // Requests by severity
  const bySeverity = ["CRITICAL","HIGH","MODERATE","LOW"].map(s => ({
    name: s,
    value: requests.filter(r => r.severity === s).length,
  }));

  // Requests by day (last 7 days)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = requests.filter(r => {
      const rd = new Date(r.created_at);
      return rd.toDateString() === d.toDateString();
    }).length;
    return { name: day, requests: count };
  });

  // Resources by type
  const byResourceType = [...new Set(resources.map(r => r.type))].map(type => ({
    name: type.replace(/_/g, " "),
    available: resources.filter(r => r.type === type && r.status === "AVAILABLE").length,
    occupied:  resources.filter(r => r.type === type && r.status === "OCCUPIED").length,
  }));

  // Requests by month (last 6 months)
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const count = requests.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    }).length;
    const critical = requests.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear() && r.severity === "CRITICAL";
    }).length;
    return { name: label, total: count, critical };
  });

  // Negotiation scores over time
  const negScores = negotiations
    .filter(n => n.overall_score !== null)
    .map((n, i) => ({ name: `N${i + 1}`, score: n.overall_score || 0 }));

  const completed   = negotiations.filter(n => n.status === "COMPLETED").length;
  const successRate = negotiations.length > 0 ? Math.round((completed / negotiations.length) * 100) : 0;
  const avgScore    = negotiations.length > 0
    ? Math.round(negotiations.reduce((s, n) => s + (n.overall_score || 0), 0) / negotiations.length)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Last 7 days — your hospital&apos;s performance</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests",    value: requests.length,    icon: Activity,     color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Critical",          value: bySeverity[0].value,icon: AlertTriangle,color: "text-red-600",    bg: "bg-red-50" },
          { label: "AI Success Rate",   value: `${successRate}%`,  icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50" },
          { label: "Avg AI Score",      value: `${avgScore}%`,     icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests per day */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Requests — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="requests" fill="#1976D2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Requests per month */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Requests — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="total"    fill="#1976D2" radius={[4, 4, 0, 0]} name="Total"    />
              <Bar dataKey="critical" fill="#DC2626" radius={[4, 4, 0, 0]} name="Critical" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#1976D2]" /><span className="text-xs text-gray-500">Total</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#DC2626]" /><span className="text-xs text-gray-500">Critical</span></div>
          </div>
        </div>

        {/* Severity distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Requests by Severity</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {bySeverity.map((_, i) => (
                    <Cell key={i} fill={["#DC2626","#F59E0B","#1976D2","#22C55E"][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {bySeverity.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ["#DC2626","#F59E0B","#1976D2","#22C55E"][i] }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource utilization */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Resource Utilization</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byResourceType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="available" fill="#22C55E" radius={[0, 4, 4, 0]} name="Available" stackId="a" />
              <Bar dataKey="occupied"  fill="#EF4444" radius={[0, 4, 4, 0]} name="Occupied"  stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI score trend */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Negotiation Scores</h3>
          {negScores.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No negotiation data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={negScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
