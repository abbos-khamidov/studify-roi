"use client";

import clsx from "clsx";
import { LayoutDashboard, MessageCircle, Receipt, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AIChat } from "@/components/dashboard/AIChat";

const mainNav = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/transactions", label: "Операции", icon: Receipt },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const mobileNav = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/transactions", label: "Операции", icon: Receipt },
  { href: "/chat", label: "Чат", icon: MessageCircle },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[22rem] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] md:flex">
        <div className="flex shrink-0 flex-col gap-1 px-3 pb-2 pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Разделы
          </p>
          <nav className="flex flex-col gap-0.5">
            {mainNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mx-3 shrink-0 border-t border-[var(--border)]" />

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Аналитика
          </p>
          <AIChat variant="sidebar" className="min-h-0 flex-1" />
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--bg-secondary)]/95 px-1 py-1.5 backdrop-blur-md md:hidden">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium",
                active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
