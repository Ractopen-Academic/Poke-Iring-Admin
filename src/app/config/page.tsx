import { getAppConfigAction } from "@/features/config/services/config-actions";
import { ConfigForm } from "@/features/config/components/config-form";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const result = await getAppConfigAction();

  return (
    <ConfigForm
      initialConfig={result.data}
      isConfigured={result.isConfigured}
    />
  );
}
