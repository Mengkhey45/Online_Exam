"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutGrid, Users, UserCog, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/admin/dashboard", label: "Overview", Icon: LayoutGrid },
  { href: "/admin/teachers", label: "Teachers", Icon: UserCog },
  { href: "/admin/roster", label: "Classes & students", Icon: Users },
];

/** Administration chrome deliberately separates institution controls from authoring. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, name, profile, signOut } = useAuth();
  const initials = name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-1 px-6">
          <Link href="/admin/dashboard" className="mr-4 flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            <span className="flex size-6 items-center justify-center rounded-sm bg-accent font-mono text-sm font-semibold text-white">E</span>
            <span className="text-sm font-semibold tracking-tight text-ink">Examroom</span>
            <span className="border-l border-rule pl-2 text-xs text-ink-3">Administration</span>
          </Link>
          <nav className="flex items-center gap-0.5" aria-label="Administration">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50", active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-surface-sunk hover:text-ink")}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-ink-3 sm:flex"><Building2 className="size-3.5" aria-hidden />{profile?.organizationName}</span>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger render={<button type="button" aria-label="Account" className="flex size-7 items-center justify-center rounded-full bg-surface-sunk font-mono text-xs font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50">{initials || "?"}</button>} />
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel className="truncate text-ink-2">{email ?? name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); router.replace("/login"); }}><LogOut />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
