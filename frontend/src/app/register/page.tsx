import { RegistrationForm } from "@/modules/registration";

export const metadata = { title: "Register your organization · Examroom" };

export default function RegisterPage() {
  return <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-6 py-10"><section className="w-full rounded-lg border border-rule bg-surface p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Examroom</p><h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Register your organization</h1><p className="mt-1 text-sm text-ink-2">You’ll become the first organization administrator.</p><div className="mt-6"><RegistrationForm /></div></section></main>;
}
