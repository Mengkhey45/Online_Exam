import { AuthGuard } from "@/lib/auth/auth-guard";
import { BuilderView } from "@/modules/builder";

export const metadata = { title: "Builder · Examroom" };

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  // Full-screen (no teacher nav shell), but still gated so the exam fetch waits
  // for the session — otherwise it fires tokenless on a hard refresh (401).
  return (
    <AuthGuard>
      <BuilderView examId={examId} />
    </AuthGuard>
  );
}
