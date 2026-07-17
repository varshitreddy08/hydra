"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface Props {
  hospitals:    { status: string; tier: string; created_at: string }[];
  requests:     { severity: string; status: string; created_at: string }[];
  negotiations: { status: string; overall_score: number | null; started_at: string }[];
}

export function PlatformAnalyticsClient({ hospitals, requests, negotiations }: Props) {
  // Requests by day (last 14 days)
  const byDay = Array.from({ length: 14 }, (_, i) => {
    const d   = new Date(Date.now() - (13 - i) * 86400000);
    const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      name:     day,
      requests: requests.filter(r => new Date(r.created_at).toDateString() === d.toDateString()).length,
    };
  });

  // Requests by severity
  const bySeverity = ["CRITICAL","HIGH","MODERATE","LOW"].map(s => ({
    name:  s, value: requests.filter(r => r.severity === s).length,
  }));

  // Hospital by status
  const byStatus = ["active","pending","suspended"].map(s => ({
    name: s, value: hospitals.filter(h => h.status === s).length,
  }));

  // AI score trend
  const negScores = negotiations
    .filter(n => n.overall_score !== null)
    .map((n, i) => ({ name: `N${i + 1}`, score: n.overall_score || 0 }));

  const completed   = negotiations.filter(n => n.status === "COMPLETED").length;
  const successRate = negotiations.length > 0 ? Math.round((completed / negotiations.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Last 30 days — aggregate platform data, no patient PII</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests",  value: requests.length },
          { label: "AI Success Rate", value: `${successRate}%` },
          { label: "Negotiations",    value: negotiations.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests per day */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Requests — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="requests" fill="#1976D2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#DC2626","#F59E0B","#1976D2","#22C55E"][i] }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital status */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Hospital Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="value" fill="#1976D2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI score trend */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Negotiation Score Trend</h3>
          {negScores.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={negScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
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
