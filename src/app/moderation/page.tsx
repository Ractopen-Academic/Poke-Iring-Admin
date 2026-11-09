import { getModerationDataAction } from "@/features/moderation/services/moderation-actions";
import { QuestPoolManager } from "@/features/moderation/components/quest-pool-manager";
import { CommunityModerationTable } from "@/features/moderation/components/community-moderation-table";
import { SeasonsManagementPanel } from "@/features/moderation/components/seasons-management-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const res = await getModerationDataAction();
  const data = res.data ?? {
    quests: [],
    sightings: [],
    stories: [],
    season: {
      id: "season_1",
      number: 1,
      title: "Season 1",
      description: "",
      startsAt: new Date().toISOString(),
      endsAt: new Date().toISOString(),
      status: "active" as const,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#FF8C1A]" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
              Quests, Moderation &amp; Seasons
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Control the daily/weekly quest templates pool, moderate community cat sightings, and manage competitive seasons.
          </p>
        </div>
      </div>

      <Tabs defaultValue="quests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quests">Quest Pool Manager ({data.quests.length})</TabsTrigger>
          <TabsTrigger value="moderation">Community Moderation ({data.sightings.length + data.stories.length})</TabsTrigger>
          <TabsTrigger value="seasons">Seasons Management</TabsTrigger>
        </TabsList>

        <TabsContent value="quests">
          <Card>
            <CardContent className="pt-6">
              <QuestPoolManager initialQuests={data.quests} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardContent className="pt-6">
              <CommunityModerationTable
                initialSightings={data.sightings}
                initialStories={data.stories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasons">
          <Card>
            <CardContent className="pt-6">
              <SeasonsManagementPanel initialSeason={data.season} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
