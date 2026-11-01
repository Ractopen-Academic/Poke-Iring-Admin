import { getDatabaseOverviewAction } from "@/features/database/services/database-actions";
import { DatabaseDryRunView } from "@/features/database/components/database-dry-run-view";

export const dynamic = "force-dynamic";

export default async function DatabaseDryRunPage() {
  const res = await getDatabaseOverviewAction();

  const overview = res.data ?? {
    isConfigured: false,
    isDeploymentReady: false,
    totalMockRecords: 0,
    missingBaselineCollections: [],
    collections: [],
    checkedAt: new Date().toISOString(),
  };

  return <DatabaseDryRunView initialOverview={overview} />;
}
