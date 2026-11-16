"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { CHANNELS, claimById } from "@/lib/data";
import { loadSampleKit } from "@/lib/store";
import type { ChannelId, Severity } from "@/lib/types";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-2xl border border-line bg-surface shadow-card", className)}
      {...props}
    />
  );
}

const BUTTON = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  secondary: "border border-line-2 bg-surface text-text hover:bg-canvas",
  ghost: "text-muted hover:bg-canvas hover:text-text",
  dark: "bg-ink text-white hover:bg-ink-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof BUTTON; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        BUTTON[variant],
        className,
      )}
      {...props}
    />
  );
}

const TONE = {
  neutral: "bg-canvas text-muted border-line",
  brand: "bg-brand-soft text-brand-dark border-transparent",
  good: "bg-good-soft text-good border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
};
export type Tone = keyof typeof TONE;

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}

export const SEVERITY_TONE: Record<Severity, Tone> = { high: "bad", medium: "warn", low: "neutral" };
export const SEVERITY_LABEL: Record<Severity, string> = { high: "Blocking", medium: "Should fix", low: "Advisory" };

export function ChannelTag({ channel, className }: { channel: ChannelId; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[13px] font-medium text-text", className)}>
      <span className="size-2.5 rounded-full" style={{ background: CHANNELS[channel].color }} />
      {CHANNELS[channel].label}
    </span>
  );
}

export function PageHeader({
  step,
  title,
  lede,
  children,
}: {
  step: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{step}</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-text">{title}</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{lede}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-10 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Sparkles className="size-5" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/create"
          className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Go to Create
        </Link>
        <Button variant="secondary" onClick={loadSampleKit}>
          Load the sample kit
        </Button>
      </div>
    </Card>
  );
}

/** A claim reference chip. Hover or focus shows the approved wording and its source. */
function ClaimChip({ id }: { id: string }) {
  const claim = claimById(id);
  return (
    <span className="group relative mx-0.5 inline-block align-baseline">
      <span
        tabIndex={0}
        className={cx(
          "cursor-help rounded-md px-1.5 py-px font-mono text-[11px] font-medium",
          claim ? "bg-brand-soft text-brand-dark" : "bg-warn-soft text-warn",
        )}
      >
        {id}
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-72 whitespace-normal rounded-xl bg-ink p-3 text-left text-xs leading-relaxed text-white shadow-lift group-focus-within:block group-hover:block">
        {claim ? (
          <>
            <span className="block font-medium">{claim.text}</span>
            <span className="mt-1.5 block text-white/65">Source: {claim.reference}</span>
            <span className="mt-1 block text-white/65">Approved in: {claim.regions.join(", ")}</span>
          </>
        ) : (
          "This reference is not in the approved claims library."
        )}
      </span>
    </span>
  );
}

function withChips(text: string, keyPrefix: string) {
  return text.split(/(\[CL-\d{3}\])/).map((part, i) =>
    /^\[CL-\d{3}\]$/.test(part) ? (
      <ClaimChip key={`${keyPrefix}-${i}`} id={part.slice(1, -1)} />
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

const MARK: Record<Severity, string> = {
  high: "bg-bad-soft decoration-bad",
  medium: "bg-warn-soft decoration-warn",
  low: "bg-canvas decoration-faint",
};

/** Asset copy with claim chips, and optional highlights for the passages a check points at. */
export function CitedText({
  body,
  highlights = [],
  className,
}: {
  body: string;
  highlights?: { excerpt: string; severity: Severity }[];
  className?: string;
}) {
  const ranges = highlights
    .map((h) => ({ start: body.indexOf(h.excerpt), length: h.excerpt.length, severity: h.severity }))
    .filter((r) => r.start >= 0)
    .sort((a, b) => a.start - b.start);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, i) => {
    if (range.start < cursor) return;
    nodes.push(withChips(body.slice(cursor, range.start), `t${i}`));
    nodes.push(
      <mark
        key={`m${i}`}
        className={cx("rounded px-0.5 text-text underline decoration-2 underline-offset-4", MARK[range.severity])}
      >
        {withChips(body.slice(range.start, range.start + range.length), `h${i}`)}
      </mark>,
    );
    cursor = range.start + range.length;
  });
  nodes.push(withChips(body.slice(cursor), "end"));

  return <div className={cx("whitespace-pre-wrap text-[14.5px] leading-relaxed text-text", className)}>{nodes}</div>;
}
