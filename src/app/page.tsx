import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Database,
  Eye,
  MapPin,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { getEventsAction } from "@/features/events/services/events-actions";
import { getAppConfigAction } from "@/features/config/services/config-actions";
import { getDashboardTelemetryAction } from "@/features/database/services/database-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [eventsRes, configRes, telemetryRes] = await Promise.all([
    getEventsAction(),
    getAppConfigAction(),
    getDashboardTelemetryAction(),
  ]);

  const eventsList = eventsRes?.data || [];
  const activeEventsCount = eventsList.filter((e) => e.isActive).length;
  const isMaintenanceOn = Boolean(configRes?.data?.maintenanceMode);
  const minVersion = configRes?.data?.minAppVersion || "0.33.0";

  const telemetry = telemetryRes?.data ?? {
    isConfigured: false,
    totalSightings: 0,
    sightingsLast7Days: 0,
    totalExplorers: 0,
    totalMockRecords: 0,
    totalTerritories: 0,
    totalBarangays: 0,
    weeklyActivity: [],
    recentActivity: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Live Firestore telemetry, real explorer activity, and deployment controls for Poke: Iring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/database">
              <Database className="h-3.5 w-3.5 text-[#FF8C1A]" />
              Dry-Run &amp; Seed
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-[#FF8C1A] text-white hover:bg-[#E06D00]"
          >
            <Link href="/events">
              <Plus className="h-3.5 w-3.5" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {telemetry.totalMockRecords > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-100">
                {telemetry.totalMockRecords} development mock record
                {telemetry.totalMockRecords === 1 ? "" : "s"} detected in Firestore.
              </span>{" "}
              Purge mock data in the Database &amp; Dry-Run Center before launching your live test run.
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/database">Open Dry-Run Center &rarr;</Link>
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Live Explorer Feed</TabsTrigger>
          <TabsTrigger value="system">System State</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Verified Cat Sightings
                </CardTitle>
                <Eye className="h-4 w-4 text-[#FF8C1A]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">
                  {telemetry.totalSightings.toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {telemetry.sightingsLast7Days} logged in the last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Registered Explorers
                </CardTitle>
                <Users className="h-4 w-4 text-neutral-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">
                  {telemetry.totalExplorers.toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {telemetry.totalTerritories} cities &bull; {telemetry.totalBarangays} barangays seeded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Active Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-[#FF8C1A]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">
                  {activeEventsCount} Active
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {eventsList.length} total configured event{eventsList.length === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Game Server State
                </CardTitle>
                <Activity
                  className={`h-4 w-4 ${
                    isMaintenanceOn ? "text-red-400" : "text-emerald-400"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">
                  {isMaintenanceOn ? "Maintenance" : "Online"}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant={isMaintenanceOn ? "destructive" : "success"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {isMaintenanceOn ? "Access Locked" : "Full Access"}
                  </Badge>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    min v{minVersion}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart & Live Feed Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
            {/* Chart Block (4 Cols) */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  7-Day Cat Sightings Volume
                </CardTitle>
                <CardDescription>
                  Live daily count of verified non-mock sightings submitted from the Flutter client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
                  {telemetry.weeklyActivity.map((bar) => (
                    <div
                      key={bar.dateKey}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <span className="text-[10px] font-mono text-neutral-400">
                        {bar.sightings}
                      </span>
                      <div className="relative w-full flex items-end justify-center h-44">
                        <div
                          style={{ height: bar.height }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            bar.sightings > 0
                              ? "bg-[#FF8C1A] group-hover:bg-[#FFA242]"
                              : "bg-neutral-800"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-400">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 border-t border-neutral-800/80 pt-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#FF8C1A]" />
                    Live Community Sightings
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                    {telemetry.totalTerritories} Active City Boundaries
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Block (3 Cols) */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Live Explorer Stream
                </CardTitle>
                <CardDescription>
                  Real-time registrations, sightings, and 24h stories from Firestore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {telemetry.recentActivity.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 p-6 text-center">
                    <p className="text-xs font-medium text-neutral-300">
                      Clean Slate &mdash; Zero Player Activity Yet
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                      No real explorer sightings or stories have been recorded yet. Sign up on the mobile client to test your deployment dry run.
                    </p>
                  </div>
                ) : (
                  telemetry.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 border-b border-neutral-800/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-100">
                            {item.actor}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            {item.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">
                          {item.action}
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {item.relativeTime}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="hover:border-neutral-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">
                  Event Studio &amp; Preview
                </CardTitle>
                <Calendar className="h-4 w-4 text-[#FF8C1A]" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Author festival banners and launch popups with a live 1:1 Calico mobile shell preview before publishing.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/events">Open Event Studio &rarr;</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-neutral-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">
                  Database &amp; Dry-Run Center
                </CardTitle>
                <Database className="h-4 w-4 text-[#FF8C1A]" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Purge mock accounts, reset player test counters to zero, and seed canonical Dex, Quest, and Territory catalogs.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/database">Open Dry-Run Center &rarr;</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-neutral-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">
                  Remote App Configuration
                </CardTitle>
                <Settings className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Configure maintenance kill-switches, minimum required client semver, and live emergency broadcast banners.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/config">Open Remote Config &rarr;</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Full Live Activity Stream
              </CardTitle>
              <CardDescription>
                Chronological stream of verified non-mock explorer actions in Firestore.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {telemetry.recentActivity.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500">
                  No verified explorer activity recorded yet.
                </div>
              ) : (
                telemetry.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-3 rounded-lg border border-neutral-800 bg-neutral-900/60"
                  >
                    <div>
                      <span className="font-semibold text-neutral-200">
                        {item.actor}
                      </span>{" "}
                      <span className="text-neutral-500">({item.badge})</span>:{" "}
                      <span className="text-neutral-400">{item.action}</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      {item.relativeTime}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                System Diagnostics
              </CardTitle>
              <CardDescription>
                Firebase Admin SDK and Cloud Firestore operational status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs text-neutral-400">
              <div>
                Firestore Admin SDK:{" "}
                {telemetry.isConfigured ? "Connected" : "Missing Env Credentials"}
              </div>
              <div>Target Mobile Semver: v{minVersion}</div>
              <div>Seeded Cities: {telemetry.totalTerritories}</div>
              <div>Seeded Barangays: {telemetry.totalBarangays}</div>
              <div>Detected Mock Docs: {telemetry.totalMockRecords}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
