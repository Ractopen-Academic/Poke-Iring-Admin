"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Megaphone,
  Save,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { GlobalAppConfig } from "../types/config.types";
import { updateAppConfigAction } from "../services/config-actions";

interface ConfigFormProps {
  initialConfig: GlobalAppConfig;
  isConfigured: boolean;
}

export function ConfigForm({ initialConfig, isConfigured }: ConfigFormProps) {
  const [config, setConfig] = useState<GlobalAppConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updateAppConfigAction(config);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: "success", message: "Global configurations saved successfully." });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to save configuration settings.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Notice */}
      {!isConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Demonstration Mode
          </div>
          <p className="mt-1 text-neutral-400">
            Firebase Admin credentials are not detected in <code className="text-amber-200">.env.local</code>.
            Configuration updates will only apply in preview mode.
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Remote App Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Control maintenance kill-switches, minimum required client versions, and broadcast messages.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Maintenance Mode & Kill Switch */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">Maintenance Kill-Switch</h3>
                <p className="text-xs text-neutral-400">
                  Instantly block player sessions when emergency database migrations occur.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setConfig({ ...config, maintenanceMode: !config.maintenanceMode })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                config.maintenanceMode ? "bg-red-600" : "bg-neutral-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300">
              Maintenance Screen Message
            </label>
            <textarea
              rows={2}
              value={config.maintenanceMessage}
              onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 2: Version Enforcement */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800/80 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Client Version Enforcement
              </h3>
              <p className="text-xs text-neutral-400">
                Require players on older builds to update their APK before accessing online features.
              </p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-medium text-neutral-300">
              Minimum Required App Version
            </label>
            <input
              type="text"
              required
              value={config.minAppVersion}
              onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })}
              placeholder="1.0.0"
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 3: Broadcast Announcement Banner */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
                <Megaphone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">
                  Live Broadcast Banner
                </h3>
                <p className="text-xs text-neutral-400">
                  Display a top notification banner on all connected mobile players.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setConfig({ ...config, isBroadcastActive: !config.isBroadcastActive })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                config.isBroadcastActive ? "bg-emerald-500" : "bg-neutral-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.isBroadcastActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300">
              Banner Message Text
            </label>
            <input
              type="text"
              value={config.broadcastBanner}
              onChange={(e) => setConfig({ ...config, broadcastBanner: e.target.value })}
              placeholder="e.g. Server maintenance scheduled for tonight at 23:00 UTC."
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 4: Global Double Paw Points */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-red-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">
                  Global Double Paw Points
                </h3>
                <p className="text-xs text-neutral-400">
                  Instantly activate double points multiplier across all sighting boops and territory captures.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setConfig({
                  ...config,
                  doublePointsGlobal: !config.doublePointsGlobal,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                config.doublePointsGlobal ? "bg-red-600" : "bg-neutral-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.doublePointsGlobal ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving Configuration..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
