"use client";

import { useState } from "react";
import { Lock, Unlock, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resetExplorerTerritoryLockAction } from "../services/database-actions";
import type { ExplorerTerritoryBinding } from "../types/database.types";

interface TerritoryBindingsTableProps {
  initialBindings: ExplorerTerritoryBinding[];
}

export function TerritoryBindingsTable({ initialBindings }: TerritoryBindingsTableProps) {
  const [bindings, setBindings] = useState<ExplorerTerritoryBinding[]>(initialBindings);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [successUserId, setSuccessUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = async (userId: string) => {
    setLoadingUserId(userId);
    setErrorMessage(null);

    const res = await resetExplorerTerritoryLockAction(userId);
    setLoadingUserId(null);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to reset territory lock.");
      return;
    }

    setSuccessUserId(userId);
    setBindings((prev) =>
      prev.map((b) =>
        b.userId === userId
          ? { ...b, isLocked: false, lockedUntilIso: null }
          : b
      )
    );
    setTimeout(() => setSuccessUserId(null), 3000);
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {bindings.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-xs text-neutral-400">
          No explorer home territory bindings recorded in Firestore yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-neutral-800 bg-neutral-900 text-neutral-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Explorer</th>
                <th className="py-2.5 px-3 font-semibold">Home City</th>
                <th className="py-2.5 px-3 font-semibold">Barangay</th>
                <th className="py-2.5 px-3 font-semibold">Lock Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {bindings.map((b) => (
                <tr key={b.userId} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-neutral-100">
                    <div>{b.username}</div>
                    {b.displayName && (
                      <div className="text-[10px] text-neutral-500">{b.displayName}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{b.city}</td>
                  <td className="py-2.5 px-3 text-neutral-400">{b.barangay}</td>
                  <td className="py-2.5 px-3">
                    {b.isLocked ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        Locked (Annual Cooldown)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                      >
                        <Unlock className="h-2.5 w-2.5" />
                        Unlocked
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {successUserId === b.userId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <Check className="h-3 w-3" />
                        Cooldown Reset
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingUserId === b.userId || !b.isLocked}
                        onClick={() => handleUnlock(b.userId)}
                        className="h-7 gap-1 border-neutral-700 bg-neutral-800/60 text-[11px] hover:border-amber-500 hover:text-amber-300"
                      >
                        <ShieldAlert className="h-3 w-3 text-amber-400" />
                        {loadingUserId === b.userId ? "Unlocking..." : "Reset Cooldown"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
