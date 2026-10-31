import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Download,
  Eye,
  MapPin,
  Plus,
  Settings,
} from "lucide-react";
import { getEventsAction } from "@/features/events/services/events-actions";
import { getAppConfigAction } from "@/features/config/services/config-actions";
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
  const [eventsRes, configRes] = await Promise.all([
    getEventsAction(),
    getAppConfigAction(),
  ]);

  const activeEventsCount = eventsRes.data.filter((e) => e.isActive).length;
  const isMaintenanceOn = configRes.data.maintenanceMode;

  const weeklyActivity = [
    { day: "Mon", sightings: 320, claims: 45, height: "45%" },
    { day: "Tue", sightings: 480, claims: 62, height: "65%" },
    { day: "Wed", sightings: 390, claims: 51, height: "55%" },
    { day: "Thu", sightings: 610, claims: 84, height: "82%" },
    { day: "Fri", sightings: 720, claims: 110, height: "92%" },
    { day: "Sat", sightings: 850, claims: 145, height: "100%" },
    { day: "Sun", sightings: 780, claims: 130, height: "95%" },
  ];

  const recentSightings = [
    {
      trainer: "Kazu Trainer",
      action: "Claimed Territory Ring #4 (Ayala Blvd)",
      time: "4 minutes ago",
      faction: "Whiskers",
    },
    {
      trainer: "Mika_Feline",
      action: "Discovered Rare Siamese Sighting",
      time: "18 minutes ago",
      faction: "Alley Prowlers",
    },
    {
      trainer: "Ryme_Dev",
      action: "Booped story sighting +5 Paw Points",
      time: "32 minutes ago",
      faction: "Whiskers",
    },
    {
      trainer: "Kaids77",
      action: "Reached Season 1 Mythic Division 3",
      time: "1 hour ago",
      faction: "Night Stalkers",
    },
    {
      trainer: "Admin_Portal",
      action: "Synchronized global event multiplier",
      time: "2 hours ago",
      faction: "System",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Global telemetry, trainer activities, and live game administration for Poke-Iring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Telemetry
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/events">
              <Plus className="h-3.5 w-3.5" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Trainer Feed</TabsTrigger>
          <TabsTrigger value="system">System State</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Total Sightings
                </CardTitle>
                <Eye className="h-4 w-4 text-neutral-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">4,150</div>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  +18.4% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Active Territories
                </CardTitle>
                <MapPin className="h-4 w-4 text-neutral-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">48 Rings</div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  12 contested boundary rings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-neutral-400">
                  Active Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-100">
                  {activeEventsCount} Active
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {eventsRes.data.length} total registered events
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
                    v{configRes.data.minAppVersion}
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
                <CardTitle className="text-sm font-semibold">Weekly Activity Trends</CardTitle>
                <CardDescription>
                  Daily distribution of cat sightings and territory boundary claims.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
                  {weeklyActivity.map((bar) => (
                    <div
                      key={bar.day}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="relative w-full flex items-end justify-center h-48">
                        <div
                          style={{ height: bar.height }}
                          className="w-full max-w-[28px] rounded-t-md bg-red-600 transition-all duration-300 group-hover:bg-red-500"
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
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    Cat Sightings Volume
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-neutral-600" />
                    Territory Contest Rate
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Block (3 Cols) */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Live Trainer Activity</CardTitle>
                <CardDescription>
                  Real-time events streaming from connected mobile players.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSightings.map((item) => (
                  <div
                    key={item.trainer + item.time}
                    className="flex items-start justify-between gap-3 border-b border-neutral-800/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-100">
                          {item.trainer}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          {item.faction}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {item.action}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="hover:border-neutral-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Game Events Center</CardTitle>
                <Calendar className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Schedule time-limited double paw points and territory raid conditions directly into mobile player sessions.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/events">Open Event Manager &rarr;</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-neutral-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Remote App Configuration</CardTitle>
                <Settings className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Configure server maintenance kill-switches, minimum required app build numbers, and emergency banner notifications.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/config">Open Remote Config &rarr;</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Analytics Telemetry</CardTitle>
              <CardDescription>
                Detailed breakdown of user retention, daily active trainers (DAT), and territory dominance.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-xs text-neutral-500">
              Analytics pipeline active. Real-time telemetry aggregates directly from Firestore user and sighting sessions.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Full Activity Stream</CardTitle>
              <CardDescription>Historical log of player interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSightings.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-3 rounded-lg border border-neutral-800 bg-neutral-900/60"
                >
                  <div>
                    <span className="font-semibold text-neutral-200">{item.trainer}</span>:{" "}
                    <span className="text-neutral-400">{item.action}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">System Diagnostics</CardTitle>
              <CardDescription>Firebase Admin and Google Cloud operational parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs text-neutral-400">
              <div>Firestore Project: poke-iring</div>
              <div>SDK Mode: firebase-admin v14.5.0</div>
              <div>Runtime: Node.js (Vercel Serverless Function)</div>
              <div>Region: asia-southeast1</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
