"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Loader2, ShieldCheck, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ChannelTag,
  CitedText,
  EmptyState,
  PageHeader,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  cx,
} from "@/components/ui";
import { applyFix, blocking, checkAsset, readiness } from "@/lib/compliance";
import { AUDIENCES, REGIONS } from "@/lib/data";
import { editBody, markAll, setMlr, useDemo } from "@/lib/store";
import type { Issue, Severity } from "@/lib/types";

const REVIEWERS = ["Medical", "Legal", "Regulatory"];

function Ring({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const color = value >= 90 ? "var(--color-good)" : value >= 60 ? "#d98a00" : "var(--color-bad)";
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={radius} stroke="var(--color-line)" strokeWidth="7" fill="none" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const demo = useDemo();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState(0);

  // The simulated review: one reviewer signs off at a time, then the kit is approved.
  useEffect(() => {
    if (demo.mlr !== "running") return;
    const timers = REVIEWERS.map((_, i) => window.setTimeout(() => setReviewer(i + 1), (i + 1) * 1100));
    const done = window.setTimeout(
      () => {
        markAll("approved");
        setMlr("approved");
      },
      REVIEWERS.length * 1100 + 500,
    );
    return () => [...timers, done].forEach((t) => window.clearTimeout(t));
  }, [demo.mlr]);

  if (demo.assets.length === 0) {
    return (
      <>
        <PageHeader
          step="Step 3 · Review"
          title="Compliance pre-check"
          lede="Catches what reviewers would send back, before the content reaches them."
        />
        <EmptyState
          title="No drafts to check yet"
          body="Generate a campaign kit first, or load the sample kit to see the checker at work."
        />
      </>
    );
  }

  const checked = demo.assets.map((asset) => ({ asset, issues: checkAsset(asset, demo.brief) }));
  const all = checked.flatMap((c) => c.issues);
  const blockers = blocking(all);
  const score = Math.round(checked.reduce((sum, c) => sum + readiness(c.issues), 0) / checked.length);
  const count = (s: Severity) => all.filter((i) => i.severity === s).length;
  const fixable = all.filter((i) => i.fix).length;
  const current = checked.find((c) => c.asset.id === selectedId) ?? checked.find((c) => c.issues.length > 0) ?? checked[0];

  const fix = (issue: Issue) => {
    const asset = demo.assets.find((a) => a.id === issue.assetId);
    if (asset) editBody(asset.id, applyFix(asset.body, issue));
  };

  const fixAll = () => {
    for (const { asset } of checked) {
      let body = asset.body;
      for (let pass = 0; pass < 20; pass++) {
        const next = checkAsset({ ...asset, body }, demo.brief).find((i) => i.fix);
        if (!next) break;
        body = applyFix(body, next);
      }
      if (body !== asset.body) editBody(asset.id, body);
    }
  };

  const submit = () => {
    setReviewer(0);
    markAll("in_review");
    setMlr("running");
  };

  return (
    <>
      <PageHeader
        step="Step 3 · Review"
        title="Compliance pre-check"
        lede={`Each draft is checked against the approved claims library and the rules for ${REGIONS[demo.brief.region]}, so reviewers see clean content the first time.`}
      />

      <Card className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div className="flex items-center gap-4">
          <Ring value={score} />
          <div>
            <p className="text-[15px] font-semibold">Review readiness</p>
            <p className="mt-0.5 max-w-[15rem] text-[13px] leading-snug text-muted">
              {demo.mlr === "approved"
                ? "Approved by all three reviewers."
                : blockers > 0
                  ? `${blockers} blocking ${blockers === 1 ? "issue" : "issues"} to resolve before review.`
                  : all.length > 0
                    ? "No blocking issues. Remaining items are advisory."
                    : "No issues found. Ready to send."}
            </p>
          </div>
        </div>
        <div className="flex gap-6">
          {(["high", "medium", "low"] as Severity[]).map((s) => (
            <div key={s}>
              <p className="text-2xl font-semibold tabular-nums leading-none">{count(s)}</p>
              <Badge tone={SEVERITY_TONE[s]} className="mt-1.5">
                {SEVERITY_LABEL[s]}
              </Badge>
            </div>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {fixable > 0 && demo.mlr === "none" && (
            <Button variant="secondary" onClick={fixAll}>
              <Wand2 className="size-4" />
              Apply all {fixable} fixes
            </Button>
          )}
          {demo.mlr === "approved" ? (
            <Link
              href="/deliver"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
            >
              Schedule delivery
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Button onClick={submit} disabled={blockers > 0 || demo.mlr === "running"}>
              <ShieldCheck className="size-4" />
              Send to MLR review
            </Button>
          )}
        </div>

        <AnimatePresence>
          {demo.mlr !== "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4" aria-live="polite">
                {REVIEWERS.map((name, i) => {
                  const signed = demo.mlr === "approved" || reviewer > i;
                  const active = demo.mlr === "running" && reviewer === i;
                  return (
                    <div key={name} className="flex items-center gap-2 text-sm">
                      <span
                        className={cx(
                          "grid size-6 place-items-center rounded-full",
                          signed ? "bg-good text-white" : active ? "bg-brand text-white" : "bg-line text-faint",
                        )}
                      >
                        {signed ? (
                          <Check className="size-3.5" strokeWidth={3} />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : null}
                      </span>
                      <span className={signed || active ? "font-medium text-text" : "text-faint"}>
                        {name} {signed ? "approved" : active ? "reviewing" : "waiting"}
                      </span>
                    </div>
                  );
                })}
                <p className="ml-auto text-xs text-muted">
                  Simulated here. In production this hands off to your MLR system.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="p-2">
          <ul className="space-y-1">
            {checked.map(({ asset, issues }) => {
              const selected = asset.id === current.asset.id;
              const high = blocking(issues);
              return (
                <li key={asset.id}>
                  <button
                    onClick={() => setSelectedId(asset.id)}
                    aria-pressed={selected}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-brand-soft" : "hover:bg-canvas",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <ChannelTag channel={asset.channel} />
                      <span className="mt-0.5 block truncate text-xs text-muted">{AUDIENCES[asset.audience].label}</span>
                    </span>
                    {issues.length === 0 ? (
                      <CheckCircle2 className="size-5 text-good" aria-label="No issues" />
                    ) : (
                      <Badge tone={high > 0 ? "bad" : "warn"}>
                        {issues.length} {issues.length === 1 ? "issue" : "issues"}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[1fr_340px]">
          <Card className="min-w-0 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">{current.asset.title}</h2>
              <Badge tone={current.asset.status === "approved" ? "good" : "neutral"} className="ml-auto capitalize">
                {current.asset.status.replace("_", " ")}
              </Badge>
            </div>
            <CitedText
              body={current.asset.body}
              highlights={current.issues
                .filter((i) => i.excerpt)
                .map((i) => ({ excerpt: i.excerpt as string, severity: i.severity }))}
            />
          </Card>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {current.issues.length === 0 ? (
                <motion.div key="clean" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="p-6 text-center">
                    <CheckCircle2 className="mx-auto size-9 text-good" />
                    <p className="mt-2 text-sm font-semibold">This draft is clean</p>
                    <p className="mt-1 text-[13px] leading-snug text-muted">
                      Every claim is approved for {REGIONS[demo.brief.region]} and the safety information is present.
                    </p>
                  </Card>
                </motion.div>
              ) : (
                current.issues.map((issue) => (
                  <motion.div
                    key={`${issue.rule}-${issue.excerpt ?? ""}`}
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                  >
                    <Card className="p-4">
                      <Badge tone={SEVERITY_TONE[issue.severity]}>{SEVERITY_LABEL[issue.severity]}</Badge>
                      <p className="mt-2 text-sm font-semibold">{issue.title}</p>
                      <p className="mt-1 text-[13px] leading-snug text-muted">{issue.detail}</p>
                      {issue.fix && demo.mlr !== "running" && (
                        <Button size="sm" variant="secondary" className="mt-3" onClick={() => fix(issue)}>
                          <Wand2 className="size-3.5" />
                          {issue.fix.label}
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
