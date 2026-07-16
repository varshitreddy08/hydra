"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { ClinicalCondition, ResourceType } from "@/types";
import {
  MapPin,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  Phone,
  Star,
} from "lucide-react";

const HospitalMapDynamic = dynamic(() => import("./HospitalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-[#080c18]">
      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
    </div>
  ),
});

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  OPERATING_ROOM: "OR",
  ICU_BED: "ICU Bed",
  EMERGENCY_BAY: "Emg Bay",
  VENTILATOR: "Ventilator",
  CT_SCANNER: "CT Scanner",
  SURGEON: "Surgeon",
  ANESTHESIOLOGIST: "Anesthesia",
  NURSE_ICU: "ICU Nurse",
  NURSE_ED: "ED Nurse",
  CARDIOLOGIST: "Cardiologist",
  TRAUMA_SURGEON: "Trauma Surg.",
  DEFIBRILLATOR: "Defibrillator",
  BLOOD_BANK: "Blood Bank",
};

export interface ResourceMatch {
  type: ResourceType;
  label: string;
  available: boolean;
  count: number;
}

export interface HospitalSuggestion {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat?: number;
  lng?: number;
  matchScore: number;
  distanceKm: number | null;
  resourceMatches: ResourceMatch[];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MatchBadge({ score }: { score: number }) {
  if (score === 1)
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Full Match
      </span>
    );
  if (score > 0)
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        <AlertCircle className="h-3 w-3" /> Partial
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <XCircle className="h-3 w-3" /> No Match
    </span>
  );
}

interface Props {
  condition: ClinicalCondition;
  requiredTypes: ResourceType[];
}

export function HospitalMapSuggestion({ condition, requiredTypes }: Props) {
  const { hospitals, resources, userLocation, locationPermission } = useSimulationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const userPos: [number, number] | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  const suggestions: HospitalSuggestion[] = useMemo(() => {
    return hospitals
      .map((h) => {
        const hResources = resources.filter((r) => r.hospitalId === h.id);
        const resourceMatches: ResourceMatch[] = requiredTypes.map((type) => {
          const avail = hResources.filter(
            (r) => r.type === type && r.status === "AVAILABLE"
          );
          return {
            type,
            label: RESOURCE_TYPE_LABELS[type] ?? type,
            available: avail.length > 0,
            count: avail.length,
          };
        });
        const matchScore =
          requiredTypes.length > 0
            ? resourceMatches.filter((rm) => rm.available).length / requiredTypes.length
            : 0;
        const distanceKm =
          userPos && h.lat != null && h.lng != null
            ? haversineKm(userPos[0], userPos[1], h.lat, h.lng)
            : null;
        return { ...h, matchScore, distanceKm, resourceMatches };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      });
  }, [hospitals, resources, requiredTypes, userPos]);

  const best = suggestions[0];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div>
        <p className="text-sm font-bold text-white">Hospital Suggestions</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          For{" "}
          <span className="font-semibold text-blue-300">
            {condition.replace(/_/g, " ")}
          </span>{" "}
          — sorted by availability + distance
        </p>
      </div>

      {/* Location status strip */}
      {locationPermission === "requesting" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          Acquiring your GPS location…
        </div>
      )}
      {locationPermission === "granted" && userPos && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          Live location active — distances calculated from your position
        </div>
      )}
      {locationPermission === "denied" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Location blocked — to enable, click the <strong>lock icon</strong> in your browser
            address bar, set Location to Allow, then reload.
          </span>
        </div>
      )}

      {/* Map */}
      <div
        className="w-full overflow-hidden rounded-xl border border-[#1e2d4a]"
        style={{ height: 170 }}
      >
        <HospitalMapDynamic
          suggestions={suggestions}
          userPos={userPos}
          onSelectHospital={setSelectedId}
          selectedId={selectedId}
        />
      </div>

      {/* Best pick banner */}
      {best && best.matchScore > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3 py-2.5">
          <Star className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-300 truncate">
              Recommended: {best.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {Math.round(best.matchScore * 100)}% resource match
              {best.distanceKm != null ? ` · ${best.distanceKm.toFixed(1)} km away` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Hospital list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-0.5">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#1e2d4a] p-6 text-center">
            <Building2 className="h-6 w-6 text-slate-700" />
            <p className="text-xs text-slate-600">No hospitals added yet.</p>
          </div>
        ) : (
          suggestions.map((s, idx) => {
            const isSelected = selectedId === s.id;
            const isBest = idx === 0 && s.matchScore > 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(isSelected ? null : s.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10"
                    : isBest
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                    : "border-[#1e2d4a] bg-[#080c18] hover:border-[#2a3f5f]"
                }`}
              >
                {/* Row 1: rank + name + match badge + distance */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isBest
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-[#1e2d4a] text-slate-500"
                      }`}
                    >
                      {isBest ? "★" : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white leading-tight">
                        {s.name}
                      </p>
                      {s.address && (
                        <p className="truncate text-[10px] text-slate-500 mt-0.5 leading-tight">
                          {s.address}
                        </p>
                      )}
                      {s.phone && (
                        <p className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          {s.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <MatchBadge score={s.matchScore} />
                    {s.distanceKm != null ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Navigation className="h-2.5 w-2.5" />
                        {s.distanceKm < 1
                          ? `${Math.round(s.distanceKm * 1000)} m`
                          : `${s.distanceKm.toFixed(1)} km`}
                      </span>
                    ) : s.lat == null ? (
                      <span className="text-[9px] text-slate-700">no GPS data</span>
                    ) : (
                      <span className="text-[9px] text-slate-700">enable location</span>
                    )}
                  </div>
                </div>

                {/* Row 2: resource chips */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.resourceMatches.map((rm) => (
                    <span
                      key={rm.type}
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                        rm.available
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {rm.label} {rm.available ? `✓ ${rm.count}` : "✗"}
                    </span>
                  ))}
                </div>

                {/* Row 3: utilization bar */}
                {(() => {
                  const total = resources.filter((r) => r.hospitalId === s.id).length;
                  const occ = resources.filter(
                    (r) => r.hospitalId === s.id && r.status === "OCCUPIED"
                  ).length;
                  if (total === 0) return null;
                  return (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-700 uppercase tracking-wide">
                          Overall utilization
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {occ}/{total}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e2d4a]">
                        <div
                          className="h-1 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${(occ / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
