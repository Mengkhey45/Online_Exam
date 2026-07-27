import { ImportView } from "@/modules/ai-import";

export const metadata = { title: "Review conversion · Examroom" };

export default async function ImportPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ImportView examId={examId} />;
}
