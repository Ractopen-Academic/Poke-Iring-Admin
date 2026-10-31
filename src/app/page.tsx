import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Database,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { getEventsAction } from "@/features/events/services/events-actions";
import { getAppConfigAction } from "@/features/config/services/config-actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [eventsRes, configRes] = await Promise.all([
    getEventsAction(),
    getAppConfigAction(),
  ]);

  const activeEventsCount = eventsRes.data.filter((e) => e.isActive).length;
  const isMaintenanceOn = configRes.data.maintenanceMode;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            System Operations Dashboard
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Real-time management console for the Poke-Iring Flutter game environment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              isMaintenanceOn
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isMaintenanceOn ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
            {isMaintenanceOn ? "Maintenance Mode Active" : "Game Servers Online"}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Active Events</span>
            <Calendar className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-neutral-100">{activeEventsCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {eventsRes.data.length} total scheduled events
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Global Multiplier</span>
            <Sparkles className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-neutral-100">
            {configRes.data.doublePointsGlobal ? "2.0x Active" : "1.0x Standard"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Paw points calculation</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Min App Version</span>
            <Shield className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-neutral-100">
            v{configRes.data.minAppVersion}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Enforced on startup</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Database Mode</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-neutral-100">
            {eventsRes.isConfigured ? "Production" : "Demonstration"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {eventsRes.isConfigured ? "Direct Firestore write" : "Awaiting .env.local keys"}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/events"
          className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-700 hover:bg-neutral-900/60"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-200">
              <Calendar className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-neutral-200" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-neutral-100">Manage Game Events</h2>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Create scheduled weekend raids, configure double paw points, and control start/end windows for mobile users.
          </p>
        </Link>

        <Link
          href="/config"
          className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-700 hover:bg-neutral-900/60"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-200">
              <Settings className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-neutral-200" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-neutral-100">Remote App Configuration</h2>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Toggle maintenance mode, broadcast urgent notices across active player screens, and enforce minimum client versions.
          </p>
        </Link>
      </div>
    </div>
  );
}
