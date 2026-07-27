import { MonitoringView } from "@/modules/proctoring";

export const metadata = { title: "Monitoring · Examroom" };

// In the full app this route lists live exams; the demo opens one directly.
export default function MonitoringPage() {
  return <MonitoringView examId="exm_001" />;
}
