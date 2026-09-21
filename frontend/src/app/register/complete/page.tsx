import { RegistrationComplete } from "@/modules/registration";

export const metadata = { title: "Confirm your email · Examroom" };

export default function RegistrationCompletePage() {
  return <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-6 py-10"><section className="w-full rounded-lg border border-rule bg-surface p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Examroom</p><h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Confirm your email</h1><div className="mt-4"><RegistrationComplete /></div></section></main>;
}
