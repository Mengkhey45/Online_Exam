import { ResultsView } from "@/modules/results";

export const metadata = { title: "Results · Examroom" };

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ResultsView examId={examId} />;
}
