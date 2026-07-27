import { GradingView } from "@/modules/grading";

export const metadata = { title: "Grading · Examroom" };

export default async function GradingPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <GradingView examId={examId} />;
}
