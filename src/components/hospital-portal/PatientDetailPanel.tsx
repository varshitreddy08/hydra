"use client";

import { useState } from "react";
import { X, GitBranch, Heart, Activity, Thermometer, Wind, Eye, Droplets } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { ReferralModal } from "./ReferralModal";
import type { Patient } from "@/types";

const TRIAGE_COLORS: Record<string, string> = {
  P1_IMMEDIATE:   "text-red-400 bg-red-500/10 border-red-500/30",
  P2_EMERGENT:    "text-orange-400 bg-orange-500/10 border-orange-500/30",
  P3_URGENT:      "text-amber-400 bg-amber-500/10 border-amber-500/30",
  P4_LESS_URGENT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  P5_NON_URGENT:  "text-slate-400 bg-slate-800 border-slate-700",
};

function VitalRow({ label, value, icon: Icon, warning }: { label: string; value: string; icon: React.ElementType; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2d4a] last:border-0">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm font-semibold font-mono ${warning ? "text-red-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  patient: Patient;
  onClose: () => void;
  hospitalId: string;
}

export function PatientDetailPanel({ patient, onClose, hospitalId }: Props) {
  const [referralOpen, setReferralOpen] = useState(false);
  const { hospitals, resources } = useSimulationStore();

  const allocatedResources = resources.filter((r) => patient.allocatedResources.includes(r.id));
  const referredHospitals = hospitals.filter((h) => patient.referredHospitalIds?.includes(h.id));
  const triageCls = TRIAGE_COLORS[patient.triageScore.triageLevel] ?? TRIAGE_COLORS.P5_NON_URGENT;

  const arrivedDate = new Date(patient.arrivedAt).toLocaleString();
  const waitMins = Math.floor((Date.now() - patient.arrivedAt) / 60000);
  const waitLabel = waitMins < 60 ? `${waitMins}m` : `${Math.floor(waitMins / 60)}h ${waitMins % 60}m`;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-[#0d1526] border-l border-[#1e2d4a] shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a] sticky top-0 bg-[#0d1526] z-10">
          <div>
            <h2 className="text-base font-bold text-white">{patient.mrn}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Patient Detail</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Demographics */}
          <section>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-white">{patient.age} y/o {patient.sex === "M" ? "Male" : patient.sex === "F" ? "Female" : "Other"}</span>
                </div>
                <p className="text-sm text-slate-300">{patient.condition.replace(/_/g, " ")}</p>
                {patient.conditionDetails && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{patient.conditionDetails}</p>
                )}
              </div>
              <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${triageCls}`}>
                {patient.triageScore.triageLevel.replace(/_/g, " ")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#080c18] border border-[#1e2d4a] rounded-lg px-3 py-2">
                <p className="text-slate-500 mb-0.5">Arrived</p>
                <p className="text-slate-300">{arrivedDate}</p>
              </div>
              <div className="bg-[#080c18] border border-[#1e2d4a] rounded-lg px-3 py-2">
                <p className="text-slate-500 mb-0.5">Wait time</p>
                <p className="text-white font-semibold">{waitLabel}</p>
              </div>
            </div>
          </section>

          {/* Triage Score */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Triage Assessment</h3>
            <div className="bg-[#080c18] border border-[#1e2d4a] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">Overall Score</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        patient.triageScore.raw >= 75 ? "bg-red-400" :
                        patient.triageScore.raw >= 50 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${patient.triageScore.raw}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm">{patient.triageScore.raw}/100</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { label: "MEWS", value: patient.triageScore.mewsScore },
                  { label: "ESI", value: patient.triageScore.esiScore },
                  { label: "Condition", value: (patient.triageScore.breakdown.conditionScore * 100).toFixed(0) + "%" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#0d1526] border border-[#1e2d4a] rounded-lg py-2">
                    <p className="text-slate-500 text-[10px] mb-0.5">{label}</p>
                    <p className="text-white font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Vitals */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current Vitals</h3>
            <div className="bg-[#080c18] border border-[#1e2d4a] rounded-xl px-4 py-2">
              <VitalRow
                label="Heart Rate"
                value={`${patient.vitals.heartRate} bpm`}
                icon={Heart}
                warning={patient.vitals.heartRate > 120 || patient.vitals.heartRate < 50}
              />
              <VitalRow
                label="Blood Pressure"
                value={`${patient.vitals.systolicBP}/${patient.vitals.diastolicBP} mmHg`}
                icon={Activity}
                warning={patient.vitals.systolicBP > 180 || patient.vitals.systolicBP < 90}
              />
              <VitalRow
                label="SpO₂"
                value={`${patient.vitals.oxygenSaturation}%`}
                icon={Droplets}
                warning={patient.vitals.oxygenSaturation < 90}
              />
              <VitalRow
                label="Respiratory Rate"
                value={`${patient.vitals.respiratoryRate} /min`}
                icon={Wind}
                warning={patient.vitals.respiratoryRate > 25 || patient.vitals.respiratoryRate < 10}
              />
              <VitalRow
                label="Temperature"
                value={`${patient.vitals.temperature}°C`}
                icon={Thermometer}
                warning={patient.vitals.temperature > 38.5 || patient.vitals.temperature < 35}
              />
              <VitalRow
                label="GCS"
                value={`${patient.vitals.consciousnessScore}/15`}
                icon={Eye}
                warning={patient.vitals.consciousnessScore < 10}
              />
            </div>
          </section>

          {/* Allocated Resources */}
          {allocatedResources.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Allocated Resources</h3>
              <div className="space-y-1.5">
                {allocatedResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-3 py-2 bg-[#080c18] border border-[#1e2d4a] rounded-lg"
                  >
                    <div>
                      <p className="text-xs text-white font-medium">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.type.replace(/_/g, " ")} · {r.location}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Required Resources */}
          {patient.requiresResourceTypes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Required Resources</h3>
              <div className="flex flex-wrap gap-1.5">
                {patient.requiresResourceTypes.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 text-[10px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg"
                  >
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Hospital Referrals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hospital Referrals
              </h3>
              <button
                onClick={() => setReferralOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                {referredHospitals.length > 0 ? "Edit" : "Add"} Referral
              </button>
            </div>

            {referredHospitals.length === 0 ? (
              <div className="px-4 py-3 bg-[#080c18] border border-dashed border-[#1e2d4a] rounded-xl text-center">
                <p className="text-xs text-slate-600">No hospitals referred yet.</p>
                <p className="text-[10px] text-slate-700 mt-0.5">Click "Add Referral" to recommend transfer hospitals.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referredHospitals.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 px-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-purple-200 truncate">{h.name}</p>
                      {h.address && (
                        <p className="text-[10px] text-slate-500 truncate">{h.address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Referral modal */}
      {referralOpen && (
        <ReferralModal
          patient={patient}
          currentHospitalId={hospitalId}
          onClose={() => setReferralOpen(false)}
        />
      )}
    </>
  );
}
