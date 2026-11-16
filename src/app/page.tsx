"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Badge, Button, Card, PageHeader, cx } from "@/components/ui";
import { AUDIENCES, CAMPAIGNS, CHANNELS, EVENTS, PRODUCTS, STAGES, claimsFor, productById } from "@/lib/data";
import type { Stage } from "@/lib/data";
import { setBrief, useDemo } from "@/lib/store";
import type { AudienceId, ChannelId } from "@/lib/types";

const STAGE_HREF: Record<Stage, string> = {
  Plan: "/",
  Create: "/create",
  Review: "/review",
  Deliver: "/deliver",
  Analyze: "/analyze",
};

function draftBrief(eventId: string, productId: string) {
  const event = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0];
  const product = productById(productId);
  const claims = claimsFor(productId).filter((c) => c.topic === "efficacy" || c.topic === "safety");
  const audiences: AudienceId[] = ["ep", "referring"];
  const channels: ChannelId[] = ["linkedin", "x", "email"];
  return {
    campaignName: `${product.trial} at the ${event.name.toLowerCase()}`,
    objective: `Make the ${product.trial} results the most discussed ${product.category.toLowerCase()} data at the ${event.name.toLowerCase()}, and turn that attention into referral conversations.`,
    audiences,
    channels,
    claims,
    timeline: [
      `${event.weeksOut - 3} weeks out: drafts through pre-check and into review`,
      "2 weeks out: teaser posts and representative emails",
      "Congress week: daily posts timed to the sessions",
      "1 week after: recap and performance review",
    ],
  };
}

export default function PlanPage() {
  const router = useRouter();
  const demo = useDemo();
  const [eventId, setEventId] = useState(EVENTS[0].id);
  const [productId, setProductId] = useState(EVENTS[0].focus);
  const [phase, setPhase] = useState<"idle" | "drafting" | "done">("idle");
  const draft = draftBrief(eventId, productId);

  const scheduled = demo.assets.some((a) => a.status === "scheduled" || a.status === "published");
  const myStage: Stage =
    demo.assets.length === 0 ? "Create" : demo.mlr !== "approved" ? "Review" : scheduled ? "Analyze" : "Deliver";

  const startDraft = () => {
    setPhase("drafting");
    window.setTimeout(() => setPhase("done"), 1100);
  };

  const openInCreate = () => {
    setBrief({
      campaignName: draft.campaignName,
      productId,
      audiences: draft.audiences,
      channels: draft.channels,
    });
    router.push("/create");
  };

  return (
    <>
      <PageHeader
        step="Step 1 · Plan"
        title="Campaign pipeline"
        lede="Every campaign for the franchise, from first brief to results. Pick up where the team left off, or start a new one."
      >
        <Button onClick={() => router.push("/create")}>
          <Plus className="size-4" />
          New campaign
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {STAGES.map((stage, column) => {
          const cards = CAMPAIGNS.filter((c) => c.stage === stage);
          const mine = stage === myStage;
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: column * 0.05, duration: 0.3 }}
              className="rounded-2xl bg-line/45 p-2.5"
            >
              <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
                <p className="text-[13px] font-semibold text-text">{stage}</p>
                <span className="text-xs tabular-nums text-muted">{cards.length + (mine ? 1 : 0)}</span>
              </div>
              <div className="space-y-2">
                {mine && (
                  <button
                    onClick={() => router.push(STAGE_HREF[myStage])}
                    className="group block w-full rounded-xl border-2 border-brand bg-surface p-3 text-left shadow-card transition-shadow hover:shadow-lift"
                  >
                    <Badge tone="brand">Your campaign</Badge>
                    <p className="mt-2 text-sm font-medium leading-snug">{demo.brief.campaignName}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-brand">
                      Continue in {myStage}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </button>
                )}
                {cards.map((c) => (
                  <div key={c.id} className="rounded-xl border border-line bg-surface p-3">
                    <p className="text-sm font-medium leading-snug">{c.name}</p>
                    <p className="mt-1 text-xs text-muted">{productById(c.productId).name}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="grid size-5 place-items-center rounded-full bg-ink text-[9px] font-semibold text-white">
                          {c.owner}
                        </span>
                        {c.region}
                      </span>
                      <span className="tabular-nums">{c.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted" />
            <h2 className="text-[15px] font-semibold">Congress calendar</h2>
          </div>
          <p className="mt-1 text-[13px] text-muted">Select an event to plan content around it.</p>
          <ul className="mt-4 space-y-1.5">
            {EVENTS.map((event) => {
              const selected = event.id === eventId;
              return (
                <li key={event.id}>
                  <button
                    onClick={() => {
                      setEventId(event.id);
                      setProductId(event.focus);
                      setPhase("idle");
                    }}
                    aria-pressed={selected}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      selected ? "border-brand bg-brand-soft" : "border-transparent hover:bg-canvas",
                    )}
                  >
                    <span className="w-16 shrink-0 text-xs font-medium text-muted">{event.when}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{event.name}</span>
                      <span className="block text-xs text-muted">{productById(event.focus).category}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{event.weeksOut} wks</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              <h2 className="text-[15px] font-semibold">Draft a campaign brief</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="brief-product">
                Product
              </label>
              <select
                id="brief-product"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setPhase("idle");
                }}
                className="h-8 rounded-lg border border-line-2 bg-surface px-2 text-[13px]"
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {phase === "idle" && (
            <div className="mt-5 rounded-xl border border-dashed border-line-2 p-8 text-center">
              <p className="text-sm text-muted">
                A brief for <span className="font-medium text-text">{productById(productId).name}</span> at the{" "}
                <span className="font-medium text-text">{EVENTS.find((e) => e.id === eventId)?.name}</span>, built from
                the approved claims and the congress date.
              </p>
              <Button className="mt-4" onClick={startDraft}>
                <Sparkles className="size-4" />
                Draft the brief
              </Button>
            </div>
          )}

          {phase === "drafting" && (
            <div className="mt-5 space-y-3" aria-live="polite" aria-label="Drafting the brief">
              {[92, 78, 85, 60].map((w) => (
                <div key={w} className="shimmer h-4 rounded-md" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <p className="text-base font-semibold">{draft.campaignName}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{draft.objective}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Audiences and channels</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.audiences.map((a) => (
                      <Badge key={a} tone="brand">
                        {AUDIENCES[a].label}
                      </Badge>
                    ))}
                    {draft.channels.map((c) => (
                      <Badge key={c}>{CHANNELS[c].label}</Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-faint">Approved claims to lead with</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-text">
                    {draft.claims.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <span className="mt-px shrink-0 rounded bg-brand-soft px-1 font-mono text-[11px] text-brand-dark">
                          {c.id}
                        </span>
                        {c.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Timeline</p>
                  <ol className="mt-2 space-y-2 border-l-2 border-line pl-4 text-[13px] leading-snug">
                    {draft.timeline.map((t) => (
                      <li key={t} className="relative">
                        <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-brand" />
                        {t}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-muted">Sample output. Edit anything in the next step.</p>
                <Button onClick={openInCreate}>
                  Open in Create
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </>
  );
}
