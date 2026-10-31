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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Remote App Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Control maintenance kill-switches, minimum required client versions, and broadcast messages.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Maintenance Mode & Kill Switch */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Maintenance Kill-Switch</CardTitle>
                  <CardDescription>
                    Instantly block player sessions when emergency database migrations occur.
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, maintenanceMode: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="maintenanceMessage">Maintenance Screen Message</Label>
              <textarea
                id="maintenanceMessage"
                rows={2}
                value={config.maintenanceMessage}
                onChange={(e) =>
                  setConfig({ ...config, maintenanceMessage: e.target.value })
                }
                className="flex w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Version Enforcement */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Client Version Enforcement
                </CardTitle>
                <CardDescription>
                  Require players on older builds to update their APK before accessing online features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="minAppVersion">Minimum Required App Version</Label>
              <Input
                id="minAppVersion"
                type="text"
                required
                value={config.minAppVersion}
                onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })}
                placeholder="1.0.0"
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Broadcast Announcement Banner */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-300">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Live Broadcast Banner
                  </CardTitle>
                  <CardDescription>
                    Display a top notification banner on all connected mobile players.
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={config.isBroadcastActive}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, isBroadcastActive: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="broadcastBanner">Banner Message Text</Label>
              <Input
                id="broadcastBanner"
                type="text"
                value={config.broadcastBanner}
                onChange={(e) =>
                  setConfig({ ...config, broadcastBanner: e.target.value })
                }
                placeholder="e.g. Server maintenance scheduled for tonight at 23:00 UTC."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Global Double Paw Points */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-red-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Global Double Paw Points
                  </CardTitle>
                  <CardDescription>
                    Instantly activate double points multiplier across all sighting boops and territory captures.
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={config.doublePointsGlobal}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, doublePointsGlobal: checked })
                }
              />
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  );
}
