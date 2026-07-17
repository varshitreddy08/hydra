"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, X, AlertTriangle } from "lucide-react";

export function DeleteRequestButton({ id, token }: { id: string; token: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("emergency_requests").delete().eq("id", id);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={e => e.target === e.currentTarget && setConfirm(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Delete Request</p>
              <p className="text-xs text-gray-500 font-mono">{token}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            This will permanently delete the emergency request. This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setConfirm(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Delete request"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
