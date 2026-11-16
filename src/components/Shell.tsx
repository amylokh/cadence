"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarRange, Check, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { REGIONS, productById } from "@/lib/data";
import { resetDemo, useDemo } from "@/lib/store";
import { Badge, cx } from "./ui";

const NAV = [
  { href: "/", label: "Plan", hint: "Campaigns and calendar", icon: CalendarRange },
  { href: "/create", label: "Create", hint: "Brief to campaign kit", icon: Sparkles },
  { href: "/review", label: "Review", hint: "Compliance pre-check", icon: ShieldCheck },
  { href: "/deliver", label: "Deliver", hint: "Schedule by channel", icon: Send },
  { href: "/analyze", label: "Analyze", hint: "Performance and insights", icon: BarChart3 },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-white/10">
        <svg viewBox="0 0 32 20" className="h-4 w-6" fill="none" aria-hidden>
          <path
            d="M1 11h7l3-8 5 15 4-11 2 4h9"
            stroke="var(--color-pulse)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-[17px] font-semibold leading-none tracking-tight text-white">Cadence</p>
        <p className="mt-1 text-[11px] leading-none text-white/55">Cardiovascular marketing</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const demo = useDemo();
  const hasKit = demo.assets.length > 0;
  const done: Record<string, boolean> = {
    "/create": hasKit,
    "/review": demo.mlr === "approved",
    "/deliver": demo.assets.some((a) => a.status === "scheduled" || a.status === "published"),
  };

  return (
    <div className="lg:pl-64">
      <aside className="z-40 flex flex-col bg-ink lg:fixed lg:inset-y-0 lg:left-0 lg:w-64">
        <div className="px-5 pb-2 pt-5 lg:pb-6">
          <Logo />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Content journey">
          <p className="hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:block">
            Content journey
          </p>
          {NAV.map((item, index) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/6 hover:text-white",
                )}
              >
                <span
                  className={cx(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                    active ? "bg-brand text-white" : "bg-white/8",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">
                    <span className="mr-1.5 text-white/40">{index + 1}</span>
                    {item.label}
                  </span>
                  <span className="hidden truncate text-xs text-white/45 lg:block">{item.hint}</span>
                </span>
                {done[item.href] && (
                  <span className="grid size-5 place-items-center rounded-full bg-good text-white" title="Done">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-4 lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <p className="text-xs font-medium text-white/85">Prototype with sample data</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Products, trials and figures are invented. Publishing is simulated.
            </p>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface/85 px-5 py-3 backdrop-blur lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{demo.brief.campaignName}</p>
          <p className="truncate text-xs text-muted">
            {productById(demo.brief.productId).name} · {REGIONS[demo.brief.region]}
          </p>
        </div>
        {demo.source && (
          <Badge tone={demo.source === "claude" ? "good" : "neutral"}>
            <Sparkles className="size-3" />
            {demo.source === "claude" ? "Drafted by Claude" : "Sample generator"}
          </Badge>
        )}
        <button
          onClick={resetDemo}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted hover:bg-canvas hover:text-text"
        >
          <RotateCcw className="size-3.5" />
          Reset demo
        </button>
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-5 py-7 lg:px-8">{children}</main>
    </div>
  );
}
