"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { ResourceType, ResourceStatus } from "@/types";

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "OPERATING_ROOM", label: "Operating Room" },
  { value: "ICU_BED", label: "ICU Bed" },
  { value: "EMERGENCY_BAY", label: "Emergency Bay" },
  { value: "VENTILATOR", label: "Ventilator" },
  { value: "CT_SCANNER", label: "CT Scanner" },
  { value: "SURGEON", label: "Surgeon" },
  { value: "ANESTHESIOLOGIST", label: "Anesthesiologist" },
  { value: "NURSE_ICU", label: "ICU Nurse" },
  { value: "NURSE_ED", label: "ED Nurse" },
  { value: "CARDIOLOGIST", label: "Cardiologist" },
  { value: "TRAUMA_SURGEON", label: "Trauma Surgeon" },
  { value: "DEFIBRILLATOR", label: "Defibrillator" },
  { value: "BLOOD_BANK", label: "Blood Bank" },
];

const STATUS_OPTIONS: { value: ResourceStatus; label: string; cls: string }[] = [
  { value: "AVAILABLE", label: "Available", cls: "text-emerald-400" },
  { value: "OCCUPIED", label: "Occupied", cls: "text-red-400" },
  { value: "MAINTENANCE", label: "Maintenance", cls: "text-amber-400" },
  { value: "OFFLINE", label: "Offline", cls: "text-slate-400" },
];

interface AddResourceDialogProps {
  open: boolean;
  onClose: () => void;
  hospitalId: string;
}

export function AddResourceDialog({ open, onClose, hospitalId }: AddResourceDialogProps) {
  const { addResource } = useSimulationStore();
  const [type, setType] = useState<ResourceType>("OPERATING_ROOM");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ResourceStatus>("AVAILABLE");
  const [capInput, setCapInput] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);

  if (!open) return null;

  function addCap() {
    const cap = capInput.trim().toLowerCase();
    if (cap && !capabilities.includes(cap)) {
      setCapabilities((prev) => [...prev, cap]);
    }
    setCapInput("");
  }

  function removeCap(cap: string) {
    setCapabilities((prev) => prev.filter((c) => c !== cap));
  }

  function handleCapKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCap();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addResource({
      hospitalId,
      type,
      name: name.trim(),
      location: location.trim(),
      status,
      capabilities,
    });
    setName("");
    setLocation("");
    setCapabilities([]);
    setCapInput("");
    setType("OPERATING_ROOM");
    setStatus("AVAILABLE");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#1e2d4a] bg-[#0d1526] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Plus className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Add Resource</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Type <span className="text-red-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                {RESOURCE_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OR-4, ICU Bed 4C, Dr. Smith"
              required
              className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Floor 2, Wing C"
              className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Capabilities
            </label>
            <div className="flex gap-2">
              <input
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                onKeyDown={handleCapKeyDown}
                placeholder="e.g. cardiac, trauma, monitoring..."
                className="flex-1 rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={addCap}
                className="rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                Add
              </button>
            </div>
            {capabilities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-300"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => removeCap(cap)}
                      className="text-blue-400 hover:text-white"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#1e2d4a] bg-transparent px-4 py-2 text-sm text-slate-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
