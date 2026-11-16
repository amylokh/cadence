"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2, Lightbulb, Table2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Button, Card, ChannelTag, PageHeader, cx } from "@/components/ui";
import type { Tone } from "@/components/ui";
import {
  ANALYTICS_CHANNELS,
  AUDIENCES,
  AUDIENCE_ENGAGEMENT,
  CHANNELS,
  COMMENTS,
  INSIGHTS,
  TOP_CONTENT,
  WEEKLY_ENGAGEMENT,
} from "@/lib/data";
import type { CommentKind } from "@/lib/data";
import { routeComment, setBrief, useDemo } from "@/lib/store";

const KPIS = [
  { label: "Impressions", value: "412k", change: "+18%", note: "vs previous 12 weeks" },
  { label: "Engagement rate", value: "5.2%", change: "+0.9 pts", note: "vs previous 12 weeks" },
  { label: "Verified physician reach", value: "12.4k", change: "+22%", note: "unique physicians" },
  { label: "Brief to approval", value: "6 days", change: "13 days faster", note: "median, was 19 days" },
];

const KIND: Record<CommentKind, { label: string; tone: Tone }> = {
  adverse: { label: "Possible adverse event", tone: "bad" },
  offlabel: { label: "Off-label question", tone: "warn" },
  question: { label: "Clinical question", tone: "brand" },
  positive: { label: "Positive", tone: "good" },
};

const number = new Intl.NumberFormat("en-US");

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number; color: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-lift">
      <p className="mb-1.5 text-xs font-medium text-muted">Week of {label}</p>
      {[...payload]
        .sort((a, b) => b.value - a.value)
        .map((p) => (
          <p key={p.dataKey} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{CHANNELS[p.dataKey as keyof typeof CHANNELS].label}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-text">{number.format(p.value)}</span>
          </p>
        ))}
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const demo = useDemo();
  const [weeks, setWeeks] = useState<4 | 12>(12);
  const [asTable, setAsTable] = useState(false);
  const data = WEEKLY_ENGAGEMENT.slice(-weeks);
  const maxRate = Math.max(...AUDIENCE_ENGAGEMENT.map((a) => a.rate));
  const openAdverse = COMMENTS.filter((c) => c.kind === "adverse" && !demo.routedComments.includes(c.id)).length;

  return (
    <>
      <PageHeader
        step="Step 5 · Analyze"
        title="Performance and next steps"
        lede="One view across channels, with what worked, what to make next, and comments that need a person."
      >
        <Badge>Sample data</Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-[13px] text-muted">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-semibold leading-none tracking-tight tabular-nums">{kpi.value}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
              <span className="inline-flex items-center gap-0.5 font-medium text-good">
                <TrendingUp className="size-3.5" />
                {kpi.change}
              </span>
              {kpi.note}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h2 className="text-[15px] font-semibold">Weekly engagements by channel</h2>
              <p className="text-[13px] text-muted">Reactions, comments, shares and clicks</p>
            </div>
            <div className="inline-flex rounded-lg border border-line-2 bg-canvas p-0.5">
              {([4, 12] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWeeks(w)}
                  aria-pressed={weeks === w}
                  className={cx(
                    "h-7 rounded-md px-2.5 text-xs font-medium",
                    weeks === w ? "bg-surface text-text shadow-sm" : "text-muted",
                  )}
                >
                  {w} weeks
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
              <Table2 className="size-3.5" />
              {asTable ? "Chart" : "Table"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {ANALYTICS_CHANNELS.map((c) => (
              <ChannelTag key={c} channel={c} className="!text-xs !font-normal !text-muted" />
            ))}
          </div>

          {asTable ? (
            <div className="mt-3 max-h-[280px] overflow-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-surface text-xs text-muted">
                  <tr>
                    <th className="py-2 font-medium">Week of</th>
                    {ANALYTICS_CHANNELS.map((c) => (
                      <th key={c} className="py-2 text-right font-medium">
                        {CHANNELS[c].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {data.map((row) => (
                    <tr key={row.week}>
                      <td className="py-1.5">{row.week}</td>
                      {ANALYTICS_CHANNELS.map((c) => (
                        <td key={c} className="py-1.5 text-right">
                          {number.format(row[c as keyof typeof row] as number)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke="var(--color-line)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-line-2)" }}
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    tickMargin={8}
                    interval={weeks === 12 ? 1 : 0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
                    width={44}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-faint)", strokeDasharray: "3 3" }} />
                  {ANALYTICS_CHANNELS.map((c) => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={c}
                      stroke={CHANNELS[c].color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                      isAnimationActive
                      animationDuration={700}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">Engagement rate by audience</h2>
          <p className="text-[13px] text-muted">Share of people reached who engaged</p>
          <ul className="mt-5 space-y-4">
            {AUDIENCE_ENGAGEMENT.map(({ audience, rate }) => (
              <li key={audience} title={`${AUDIENCES[audience].label}: ${rate}%`}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span>{AUDIENCES[audience].label}</span>
                  <span className="font-medium tabular-nums">{rate}%</span>
                </div>
                <div className="h-2.5 rounded-r bg-canvas">
                  <div
                    className="h-full rounded-r transition-all hover:brightness-90"
                    style={{ width: `${(rate / maxRate) * 100}%`, background: "#2a78d6" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {INSIGHTS.map((insight) => (
          <Card key={insight.title} className="flex flex-col p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Lightbulb className="size-4" />
            </div>
            <h3 className="text-[15px] font-semibold leading-snug">{insight.title}</h3>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{insight.body}</p>
            <button
              onClick={() => {
                setBrief(insight.brief);
                router.push("/create");
              }}
              className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              {insight.action}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <h2 className="px-5 pt-5 text-[15px] font-semibold">Top content</h2>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[520px] text-left text-[13px]">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">Content</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 text-right font-medium">Impressions</th>
                  <th className="px-5 py-2 text-right font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TOP_CONTENT.map((row) => (
                  <tr key={row.title} className="hover:bg-canvas/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{row.title}</p>
                      <p className="text-xs text-muted">
                        {AUDIENCES[row.audience].label} · {row.format}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <ChannelTag channel={row.channel} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{number.format(row.impressions)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{row.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold">Comments that need a person</h2>
            {openAdverse > 0 ? (
              <Badge tone="bad">
                <AlertTriangle className="size-3" />
                {openAdverse} to route
              </Badge>
            ) : (
              <Badge tone="good">All routed</Badge>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Comments are sorted automatically. Possible adverse events go to the safety team.
          </p>
          <ul className="mt-4 space-y-3">
            {COMMENTS.map((comment) => {
              const routed = demo.routedComments.includes(comment.id);
              const kind = KIND[comment.kind];
              return (
                <li key={comment.id} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={kind.tone}>{kind.label}</Badge>
                    <span className="text-xs text-faint">
                      {comment.author} · {CHANNELS[comment.channel].label}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-snug text-text">{comment.text}</p>
                  <p className="mt-1.5 text-xs text-muted">{comment.why}</p>
                  {comment.kind !== "positive" &&
                    (routed ? (
                      <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-good">
                        <CheckCircle2 className="size-3.5" />
                        Routed to {comment.kind === "adverse" ? "the safety team" : "medical affairs"}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant={comment.kind === "adverse" ? "dark" : "secondary"}
                        className="mt-2.5"
                        onClick={() => routeComment(comment.id)}
                      >
                        <ArrowUpRight className="size-3.5" />
                        Route to {comment.kind === "adverse" ? "the safety team" : "medical affairs"}
                      </Button>
                    ))}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
