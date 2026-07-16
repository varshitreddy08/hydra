"use client";

import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Resource, ResourceStatus } from "@/types";

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "RESERVED", label: "Reserved" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OFFLINE", label: "Offline" },
];

interface EditResourceDialogProps {
  resource: Resource;
  open: boolean;
  onClose: () => void;
}

export function EditResourceDialog({ resource, open, onClose }: EditResourceDialogProps) {
  const { updateResource } = useSimulationStore();
  const [name, setName] = useState(resource.name);
  const [location, setLocation] = useState(resource.location);
  const [status, setStatus] = useState<ResourceStatus>(resource.status);
  const [capInput, setCapInput] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>(resource.capabilities);

  if (!open) return null;

  function addCap() {
    const cap = capInput.trim().toLowerCase();
    if (cap && !capabilities.includes(cap)) setCapabilities((p) => [...p, cap]);
    setCapInput("");
  }

  function removeCap(cap: string) {
    setCapabilities((p) => p.filter((c) => c !== cap));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateResource(resource.id, {
      name: name.trim(),
      location: location.trim(),
      status,
      capabilities,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1e2d4a] bg-[#0d1526] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pencil className="h-4 w-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Edit Resource</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Floor 2, Wing A"
              className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Capabilities</label>
            <div className="flex gap-2">
              <input
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCap(); } }}
                placeholder="Add capability..."
                className="flex-1 rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={addCap}
                className="rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors"
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
