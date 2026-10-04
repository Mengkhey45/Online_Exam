import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-6">
      <header className="flex items-center justify-between border-b border-rule pb-5">
        <span className="text-sm font-semibold tracking-tight text-ink">Examroom</span>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 text-sm text-ink-2 sm:flex">
            <Button variant="ghost" nativeButton={false} render={<Link href="/enter" />}>Enter Examroom</Button>
          </span>
        <div className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>Sign in</Button>
            <Button nativeButton={false} render={<Link href="/register" />}>Register organization</Button>
          </div>
        </div>
      </header>
      <section className="grid flex-1 content-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Institutional assessment</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Run secure online examinations with your institution in control.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-2">Set up classes and teaching staff, build assessments, supervise sittings, and release results from one shared workspace.</p>
          <Button className="mt-7" size="lg" nativeButton={false} render={<Link href="/register" />}>Register your organization <ArrowRight /></Button>
          <p className="mt-4 text-sm text-ink-2">Are you a student?</p>
          <Button className="mt-2" variant="ghost" nativeButton={false} render={<Link href="/enter" />}>Enter Examroom</Button>
        </div>
        <div className="grid content-center gap-3">{[{ Icon: UsersRound, title: "Set up your institution", body: "Invite teachers and organize student rosters by class." }, { Icon: ClipboardCheck, title: "Deliver examinations", body: "Build, schedule, monitor, grade, and release results." }, { Icon: ShieldCheck, title: "Keep an audit trail", body: "Tenant-scoped access keeps each institution’s work separate." }].map(({ Icon, title, body }) => <article key={title} className="rounded-lg border border-rule bg-surface p-5"><Icon className="size-5 text-accent" aria-hidden /><h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-ink-2">{body}</p></article>)}</div>
      </section>
    </main>
  );
}
