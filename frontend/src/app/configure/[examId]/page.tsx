import { AuthGuard } from "@/lib/auth/auth-guard";
import { ConfigView } from "@/modules/config";

export const metadata = { title: "Configuration · Examroom" };

export default async function ConfigurePage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  // Gated so the config fetch waits for the session (avoids a tokenless 401 on
  // a hard refresh / direct navigation).
  return (
    <AuthGuard>
      <ConfigView examId={examId} />
    </AuthGuard>
  );
}
