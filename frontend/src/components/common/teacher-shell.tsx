"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Library, Users, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/dashboard", label: "Exams", Icon: LayoutGrid },
  { href: "/bank", label: "Question bank", Icon: Library },
  { href: "/roster", label: "Roster", Icon: Users },
  { href: "/monitoring", label: "Monitoring", Icon: Activity },
];

/** Top-bar chrome for teacher screens. Slim and scannable (AGENTS §1). */
export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-1 px-6">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
          >
            <span className="flex size-6 items-center justify-center rounded-sm bg-accent font-mono text-sm font-semibold text-white">
              E
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              Examroom
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {NAV.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-ink-2 hover:bg-surface-sunk hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

function UserMenu() {
  const { name, email, signOut } = useAuth();
  const router = useRouter();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account"
            className="flex size-7 items-center justify-center rounded-full bg-surface-sunk font-mono text-xs font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {initials || "?"}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate text-ink-2">
            {email ?? name}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
