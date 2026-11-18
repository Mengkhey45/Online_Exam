import { ResetPasswordForm } from "@/modules/auth";

export const metadata = { title: "Reset password · Examroom" };

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-lg border border-rule bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Examroom</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Choose a new password</h1>
        <div className="mt-4">
          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}
