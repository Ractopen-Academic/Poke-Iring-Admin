import Link from "next/link";
import { Database, MapPin } from "lucide-react";
import { getSeededTerritoriesAction } from "@/features/database/services/database-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TerritoriesPage() {
  const res = await getSeededTerritoriesAction();
  const territories = res.data ?? [];
  const totalBarangays = territories.reduce(
    (sum, t) => sum + t.barangays.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Territories &amp; Barangays
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Live Philippine city and barangay registry synced from the{" "}
            <code className="font-mono">territories</code> Firestore collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">
            {territories.length} Cities &bull; {totalBarangays} Barangays
          </Badge>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/database">
              <Database className="h-3.5 w-3.5 text-[#FF8C1A]" />
              Seed / Manage
            </Link>
          </Button>
        </div>
      </div>

      {territories.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-neutral-600" />
          <h3 className="mt-3 text-sm font-semibold text-neutral-200">
            No Territory Boundaries Seeded Yet
          </h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
            Populate the 14 canonical Philippine cities and barangay boundaries from the Database &amp; Dry-Run Center so explorers can select their home territory on first launch.
          </p>
          <div className="mt-5">
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-[#FF8C1A] text-white hover:bg-[#E06D00]"
            >
              <Link href="/database">
                <Database className="h-3.5 w-3.5" />
                Populate Baseline Territories
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {territories.map((territory) => (
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
                <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
