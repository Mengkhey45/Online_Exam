import { MonitoringView } from "@/modules/proctoring";

export const metadata = { title: "Monitoring · Examroom" };

export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <MonitoringView examId={examId} />;
}