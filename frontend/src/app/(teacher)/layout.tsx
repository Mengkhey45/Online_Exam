import { TeacherShell } from "@/components/common/teacher-shell";
import { AuthGuard } from "@/lib/auth/auth-guard";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["teacher"]}>
      <TeacherShell>{children}</TeacherShell>
    </AuthGuard>
  );
}
