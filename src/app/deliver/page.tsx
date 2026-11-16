"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarPlus, Clock, Lock, Target, Undo2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Badge, Button, Card, ChannelTag, EmptyState, PageHeader, cx } from "@/components/ui";
import {
  AUDIENCES,
  CHANNELS,
  OTHER_SCHEDULED,
  REGIONS,
  SUGGESTED_SLOTS,
  TARGETING,
  claimById,
} from "@/lib/data";
import { updateAsset, useDemo } from "@/lib/store";
import type { Asset } from "@/lib/types";

/* The calendar covers the two weeks starting Monday 16 November 2026, the prototype's fixed "today". */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabel = (day: number) => `${WEEKDAYS[day % 7]}, Nov ${16 + day}`;
const slotOf = (asset: Asset) => {
  const [day, time] = (asset.scheduledAt ?? "").split("|");
  return { day: Number(day), time };
};

/** The post as it would publish: claim markers become numbered references. */
function FinalPost({ asset }: { asset: Asset }) {
  const order: string[] = [];
  const parts = asset.body.split(/\s*(\[CL-\d{3}\])/).map((part, i) => {
    const match = part.match(/^\[(CL-\d{3})\]$/);
    if (!match) return <span key={i}>{part}</span>;
    if (!order.includes(match[1])) order.push(match[1]);
    return (
      <sup key={i} className="ml-px text-[10px] font-medium text-brand">
        {order.indexOf(match[1]) + 1}
      </sup>
    );
  });
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-full bg-ink text-xs font-semibold text-white">Ca</div>
        <div>
          <p className="text-[13px] font-semibold leading-tight">Cadence Cardiovascular</p>
          <p className="text-xs text-faint">Sample account · {CHANNELS[asset.channel].label}</p>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{parts}</div>
      {order.length > 0 && (
        <ol className="mt-3 list-decimal space-y-0.5 border-t border-line pl-4 pt-2.5 text-[11px] leading-snug text-faint">
          {order.map((id) => (
            <li key={id}>{claimById(id)?.reference ?? id}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function DeliverPage() {
  const demo = useDemo();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (demo.assets.length === 0) {
    return (
      <>
        <PageHeader
          step="Step 4 · Deliver"
          title="Schedule by channel and audience"
          lede="Approved content goes out at the right time, to the right people, in the right region."
        />
        <EmptyState
          title="Nothing to schedule yet"
          body="Generate a campaign kit and take it through review, or load the sample kit."
        />
      </>
    );
  }

  const approved = demo.mlr === "approved";
  const selected = demo.assets.find((a) => a.id === selectedId) ?? demo.assets[0];
  const isLive = (a: Asset) => a.status === "scheduled" || a.status === "published";
  const waiting = demo.assets.filter((a) => a.status === "approved");

  const schedule = (asset: Asset) => {
    const [day, time] = SUGGESTED_SLOTS[asset.channel];
    updateAsset(asset.id, { status: "scheduled", scheduledAt: `${day}|${time}` });
  };
  const unschedule = (asset: Asset) => updateAsset(asset.id, { status: "approved", scheduledAt: null });

  const entries = [
    ...OTHER_SCHEDULED.map((o) => ({ ...o, mine: false, id: `${o.day}-${o.label}` })),
    ...demo.assets.filter(isLive).map((a) => ({
      ...slotOf(a),
      channel: a.channel,
      label: AUDIENCES[a.audience].short,
      mine: true,
      id: a.id,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <PageHeader
        step="Step 4 · Deliver"
        title="Schedule by channel and audience"
        lede={`Each approved piece gets a suggested time and a targeting plan for ${REGIONS[demo.brief.region]}. Publishing is simulated in this prototype.`}
      >
        {approved && waiting.length > 0 && (
          <Button onClick={() => waiting.forEach(schedule)}>
            <CalendarPlus className="size-4" />
            Schedule all {waiting.length} at suggested times
          </Button>
        )}
        {approved && waiting.length === 0 && (
          <Link
            href="/analyze"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
          >
            See performance
            <ArrowRight className="size-4" />
          </Link>
        )}
      </PageHeader>

      {!approved && (
        <Card className="mb-5 flex flex-wrap items-center gap-3 border-warn/30 bg-warn-soft p-4">
          <Lock className="size-4 text-warn" />
          <p className="flex-1 text-sm text-text">
            Scheduling unlocks once the kit is approved. Nothing can be published without review.
          </p>
          <Link href="/review" className="text-sm font-medium text-brand hover:underline">
            Go to Review
          </Link>
        </Card>
      )}

      <Card className="mb-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[15px] font-semibold">Two-week calendar</h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand" />
              This campaign
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-line-2" />
              Other campaigns
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[840px] grid-cols-7">
            {Array.from({ length: 14 }, (_, day) => (
              <div
                key={day}
                className={cx(
                  "min-h-[104px] border-b border-r border-line p-2 [&:nth-child(7n)]:border-r-0",
                  day % 7 >= 5 && "bg-canvas/60",
                )}
              >
                <p className={cx("mb-1.5 text-xs", day === 0 ? "font-semibold text-brand" : "text-muted")}>
                  {dayLabel(day)}
                  {day === 0 && " · Today"}
                </p>
                <div className="space-y-1">
                  {entries
                    .filter((e) => e.day === day)
                    .map((e) =>
                      e.mine ? (
                        <motion.button
                          key={e.id}
                          layoutId={`slot-${e.id}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedId(e.id)}
                          className="flex w-full items-center gap-1.5 rounded-md bg-brand px-1.5 py-1 text-left text-[11px] font-medium text-white"
                        >
                          <span className="size-2 shrink-0 rounded-full ring-1 ring-white/70" style={{ background: CHANNELS[e.channel].color }} />
                          <span className="tabular-nums">{e.time}</span>
                          <span className="truncate">
                            {CHANNELS[e.channel].label} · {e.label}
                          </span>
                        </motion.button>
                      ) : (
                        <div
                          key={e.id}
                          className="flex items-center gap-1.5 rounded-md bg-line/70 px-1.5 py-1 text-[11px] text-muted"
                          title={e.label}
                        >
                          <span className="size-2 shrink-0 rounded-full" style={{ background: CHANNELS[e.channel].color }} />
                          <span className="tabular-nums">{e.time}</span>
                          <span className="truncate">{e.label}</span>
                        </div>
                      ),
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          {demo.assets.map((asset) => {
            const [day, time, reason] = SUGGESTED_SLOTS[asset.channel];
            const targeting = TARGETING[asset.channel][asset.audience] ?? TARGETING[asset.channel].default;
            const live = isLive(asset);
            const slot = live ? slotOf(asset) : { day, time };
            return (
              <Card
                key={asset.id}
                onClick={() => setSelectedId(asset.id)}
                className={cx(
                  "cursor-pointer p-4 transition-shadow hover:shadow-lift",
                  selected.id === asset.id && "ring-2 ring-brand",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ChannelTag channel={asset.channel} />
                  <Badge tone="brand">{AUDIENCES[asset.audience].label}</Badge>
                  <Badge tone={live ? "good" : "neutral"} className="ml-auto capitalize">
                    {live && <CalendarCheck className="size-3" />}
                    {asset.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                      <Clock className="size-3.5" />
                      {live ? "Scheduled for" : "Suggested time"}
                    </p>
                    <p className="mt-1 text-sm font-medium tabular-nums">
                      {dayLabel(slot.day)} at {slot.time}
                    </p>
                    <p className="text-[13px] text-muted">{reason}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                      <Target className="size-3.5" />
                      Targeting
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[13px] text-muted">
                      {targeting.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {live ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        unschedule(asset);
                      }}
                    >
                      <Undo2 className="size-3.5" />
                      Unschedule
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={asset.status !== "approved"}
                      onClick={(e) => {
                        e.stopPropagation();
                        schedule(asset);
                      }}
                    >
                      <CalendarPlus className="size-3.5" />
                      Schedule
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 lg:sticky lg:top-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Preview as published</p>
          <FinalPost asset={selected} />
        </Card>
      </div>
    </>
  );
}
