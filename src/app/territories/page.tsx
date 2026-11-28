import Link from "next/link";
import { Database, Flame, MapPin, Swords, Users } from "lucide-react";
import { getTerritoryManagementDataAction } from "@/features/database/services/database-actions";
import { TerritoryBindingsTable } from "@/features/database/components/territory-bindings-table";
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

export default async function TerritoriesPage() {
  const res = await getTerritoryManagementDataAction();
  const data = res.data ?? {
    territories: [],
    standings: [],
    bindings: [],
    contestedCities: [],
  };

  const totalBarangays = data.territories.reduce(
    (sum, t) => sum + t.barangays.length,
    0
  );
  const totalExplorers = data.bindings.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Territory &amp; Boundary Management
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Philippine barangay/city territory standings, explorer bindings, and contested patrol zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">
            {data.territories.length} Cities &bull; {totalBarangays} Barangays &bull; {totalExplorers} Explorers
          </Badge>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/database">
              <Database className="h-3.5 w-3.5 text-[#FF8C1A]" />
              Seed / Manage
            </Link>
          </Button>
        </div>
      </div>

      {data.contestedCities.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <Swords className="h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold text-amber-100">Contested Patrol Zones Detected:</span>{" "}
            {data.contestedCities.join(", ")} &mdash; High sighting volume and competing local explorers active.
          </div>
        </div>
      )}

      {/* Standings Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.standings.slice(0, 6).map((standing) => (
          <Card key={standing.city} className="border-neutral-800 bg-neutral-900/40">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-100">
                    {standing.city}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {standing.region}
                  </CardDescription>
                </div>
                {standing.isContested ? (
                  <Badge className="gap-1 bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                    <Flame className="h-3 w-3 text-amber-400" />
                    Contested
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Stable
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 border-t border-neutral-800/80 pt-2.5 text-center text-[11px]">
                <div>
                  <div className="font-mono font-bold text-neutral-100">
                    {standing.sightingsCount}
                  </div>
                  <div className="text-neutral-500">Sightings</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-neutral-100">
                    {standing.explorersCount}
                  </div>
                  <div className="text-neutral-500">Explorers</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-neutral-100">
                    {standing.barangaysCount}
                  </div>
                  <div className="text-neutral-500">Barangays</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="standings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standings">Explorer Territory Bindings</TabsTrigger>
          <TabsTrigger value="boundaries">Seeded Boundaries ({data.territories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FF8C1A]" />
                <CardTitle className="text-sm font-semibold">
                  Registered Home Territory Bindings &amp; Lock States
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Explorers select a home Philippine territory which locks for 365 days. Admin override allows clearing the lock cooldown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TerritoryBindingsTable initialBindings={data.bindings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boundaries" className="space-y-4">
          {data.territories.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
              <MapPin className="mx-auto h-8 w-8 text-neutral-600" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-200">
                No Territory Boundaries Seeded Yet
              </h3>
              <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
                Populate Philippine cities and barangays from the Database &amp; Dry-Run Center.
              </p>
              <div className="mt-5">
                <Button asChild size="sm" className="gap-1.5 bg-[#FF8C1A] text-white hover:bg-[#E06D00]">
                  <Link href="/database">
                    <Database className="h-3.5 w-3.5" />
                    Populate Baseline Territories
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.territories.map((territory) => (
                <Card key={territory.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold text-neutral-100">
                          {territory.city}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {territory.province} &bull; {territory.region}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-[#FF8C1A]/30 bg-[#FF8C1A]/10 text-[10px] text-[#FF8C1A]"
                      >
                        {territory.barangays.length} Barangays
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {territory.barangays.map((brgy) => (
                        <span
                          key={brgy}
                          className="rounded-md border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-300"
                        >
                          {brgy}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
