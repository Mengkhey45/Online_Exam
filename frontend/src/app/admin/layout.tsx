import { AdminShell } from "@/components/common/admin-shell";
import { AuthGuard } from "@/lib/auth/auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["admin"]}><AdminShell>{children}</AdminShell></AuthGuard>;
}
