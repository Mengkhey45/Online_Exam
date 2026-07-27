import { RuntimeClient } from "./runtime-client";

export const metadata = { title: "Sitting · Examroom" };

export default async function SitPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <RuntimeClient attemptId={attemptId} />;
}
