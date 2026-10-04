"use client";

import { BookOpen, GraduationCap, Layers3, UserCog } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useOrganizationDashboard } from "../queries";
import { ResultsTab } from "@/modules/admin/components/results-tab";

const CARDS = [
  { key: "teachers", label: "Teachers", Icon: UserCog },
  { key: "classes", label: "Classes", Icon: Layers3 },
  { key: "students", label: "Students", Icon: GraduationCap },
  { key: "exams", label: "Exams", Icon: BookOpen },
] as const;

export function AdminDashboardView() {
  const dashboard = useOrganizationDashboard();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Organisation overview</h1>
        <p className="mt-0.5 text-sm text-ink-2">Manage the people and academic resources that support your examination programme.</p>
      </header>
      {dashboard.isPending ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{CARDS.map(({ key }) => <Skeleton key={key} className="h-28" />)}</div> : null}
      {dashboard.isError ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-5 text-sm text-ink-2">Couldn’t load organisation totals. <Button variant="link" className="h-auto px-1" onClick={() => dashboard.refetch()}>Try again</Button></div> : null}
      {dashboard.data ? (
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList variant="line" className="mb-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{CARDS.map(({ key, label, Icon }) => <div key={key} className="rounded-lg border border-rule bg-surface p-4"><Icon className="mb-4 size-4 text-accent" aria-hidden /><div className="font-mono text-2xl font-semibold tabular-nums text-ink">{dashboard.data[key]}</div><div className="mt-1 text-sm text-ink-2">{label}</div></div>)}</div>
            {(!dashboard.data.teachers || !dashboard.data.classes || !dashboard.data.students) ? <FirstRunChecklist dashboard={dashboard.data} /> : null}
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab results={dashboard.data.releasedResults} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function FirstRunChecklist({ dashboard }: { dashboard: { teachers: number; classes: number; students: number } }) {
  return <section className="max-w-2xl rounded-lg border border-rule bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">First-run checklist</h2>
        <p className="mt-1 text-sm text-ink-2">Complete these institutional setup steps before creating an examination.</p>
        <ul className="mt-4 space-y-2 text-sm text-ink-2">
          <li>{dashboard.teachers ? "✓" : "○"} Invite your first teacher</li>
          <li>{dashboard.classes ? "✓" : "○"} Create your first class</li>
          <li>{dashboard.students ? "✓" : "○"} Import your student roster</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <Button render={<Link href="/admin/teachers" />}>Manage teachers</Button>
          <Button variant="outline" render={<Link href="/admin/roster" />}>Manage classes and students</Button>
        </div>
      </section>;
}
