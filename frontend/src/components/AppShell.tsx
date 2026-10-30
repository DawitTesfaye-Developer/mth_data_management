"use client";

import { Building2, CalendarDays, Clock, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import { api, ApiError } from "@/lib/api";
import { AuthProvider } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Avatar, cx, Loading } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/leave", label: "Leave", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: Clock },
];

function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: user, error } = useSWR<User, ApiError>("auth/me");

  useEffect(() => {
    if (error?.status === 401) router.replace("/login");
  }, [error, router]);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (error && error.status !== 401) {
    return <p className="p-10 text-center text-sm text-danger">{error.message}</p>;
  }
  if (!user) return <Loading />;

  const nav = (
    <nav aria-label="Main" className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <Avatar name={user.name} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs capitalize text-white/55">{user.role}</p>
        </div>
      </div>
      <button onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white">
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <AuthProvider value={user}>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-side lg:flex">
        <div className="px-6 py-6 text-lg font-semibold tracking-tight text-white">PeopleDesk</div>
        {nav}
        {account}
      </aside>

      {/* mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-side px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">PeopleDesk</span>
        <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-20 flex flex-col bg-side pt-3 lg:hidden">
          {nav}
          {account}
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </AuthProvider>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: (key: string) => api(key), revalidateOnFocus: false, shouldRetryOnError: false }}>
      <Guard>{children}</Guard>
    </SWRConfig>
  );
}
