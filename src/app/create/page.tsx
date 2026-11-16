"use client";

import Link from "next/link";
import { ArrowRight, Check, Copy, FileText, Loader2, Pencil, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, ChannelTag, CitedText, PageHeader, cx } from "@/components/ui";
import { stripMarkers } from "@/lib/compliance";
import {
  AUDIENCES,
  AUDIENCE_IDS,
  CHANNELS,
  CHANNEL_IDS,
  PRODUCTS,
  REGIONS,
  SAMPLE_ABSTRACT,
  TONES,
  claimsFor,
} from "@/lib/data";
import { generateSampleKit, pairingsFor } from "@/lib/generator";
import { editBody, setBrief, setKit, useDemo } from "@/lib/store";
import type { Asset, GenerationSource, Region } from "@/lib/types";

const STEPS = [
  "Reading the source material",
  "Matching approved claims",
  "Drafting for each channel and audience",
  "Attaching citations",
];

function Chip({
  selected,
  onClick,
  children,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={title}
      className={cx(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        selected
          ? "border-brand bg-brand-soft text-brand-dark"
          : "border-line-2 bg-surface text-muted hover:border-faint hover:text-text",
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={2.5} />}
      {children}
    </button>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <p className="text-[13px] font-semibold text-text">{children}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

function AssetCard({ asset, index }: { asset: Asset; index: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset.body);
  const [copied, setCopied] = useState(false);
  const length = stripMarkers(asset.body).length;
  const limit = CHANNELS[asset.channel].limit;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stripMarkers(asset.body));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; nothing else depends on it.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, duration: 0.35 }}
    >
      <Card className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <ChannelTag channel={asset.channel} />
          <Badge>{CHANNELS[asset.channel].format}</Badge>
          <Badge tone="brand">{AUDIENCES[asset.audience].label}</Badge>
          <span
            className={cx("ml-auto text-xs tabular-nums", length > limit ? "font-semibold text-bad" : "text-faint")}
          >
            {length} / {limit}
          </span>
        </div>
        <div className="flex-1 px-4 py-4">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              aria-label={`Edit ${asset.title}`}
              className="w-full resize-y rounded-xl border border-line-2 bg-canvas p-3 font-mono text-[13px] leading-relaxed"
            />
          ) : (
            <CitedText body={asset.body} />
          )}
        </div>
        <div className="flex items-center gap-1 border-t border-line px-3 py-2">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  editBody(asset.id, draft);
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(asset.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(asset.body);
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function CreatePage() {
  const demo = useDemo();
  const { brief } = demo;
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const toggle = <T extends string>(list: T[], item: T) =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const planned = pairingsFor(brief).length;
  const ready = brief.source.trim().length > 0 && brief.channels.length > 0 && brief.audiences.length > 0;
  const libraryClaims = claimsFor(brief.productId);

  const generate = async () => {
    setGenerating(true);
    setStep(0);
    STEPS.forEach((_, i) => timers.current.push(window.setTimeout(() => setStep(i), i * 650)));
    const minimum = new Promise((resolve) => timers.current.push(window.setTimeout(resolve, STEPS.length * 650)));

    let result: { assets: Asset[]; source: GenerationSource; note: string | null };
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      if (!response.ok) throw new Error(`Generation failed with status ${response.status}`);
      result = await response.json();
    } catch {
      result = {
        assets: generateSampleKit(brief),
        source: "sample",
        note: "The generation service could not be reached, so these drafts come from the built-in sample generator.",
      };
    }
    await minimum;
    setKit(result.assets, result.source, result.note);
    setGenerating(false);
  };

  const citations = demo.assets.reduce((n, a) => n + (a.body.match(/\[CL-\d{3}\]/g)?.length ?? 0), 0);

  return (
    <>
      <PageHeader
        step="Step 2 · Create"
        title="Brief to campaign kit"
        lede="Give it the source material and who it is for. Every draft is built from approved claims, and each claim carries its citation."
      />

      <div className="grid items-start gap-5 xl:grid-cols-[400px_1fr]">
        <Card className="space-y-5 p-5 xl:sticky xl:top-20">
          <div>
            <Label>Campaign name</Label>
            <input
              value={brief.campaignName}
              onChange={(e) => setBrief({ campaignName: e.target.value })}
              aria-label="Campaign name"
              className="h-10 w-full rounded-xl border border-line-2 bg-surface px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold">Source material</p>
              <button
                onClick={() => setBrief({ source: SAMPLE_ABSTRACT })}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <FileText className="size-3.5" />
                Use the sample abstract
              </button>
            </div>
            <textarea
              value={brief.source}
              onChange={(e) => setBrief({ source: e.target.value })}
              rows={7}
              aria-label="Source material"
              placeholder="Paste a trial abstract, a launch plan or a few notes."
              className="w-full resize-y rounded-xl border border-line-2 bg-surface p-3 text-[13px] leading-relaxed placeholder:text-faint"
            />
          </div>

          <div>
            <Label>Product</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCTS.map((p) => (
                <Chip key={p.id} selected={brief.productId === p.id} onClick={() => setBrief({ productId: p.id })}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label hint="Claims are checked against it">Region</Label>
            <div className="inline-flex rounded-xl border border-line-2 bg-canvas p-1">
              {(Object.keys(REGIONS) as Region[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setBrief({ region: r })}
                  aria-pressed={brief.region === r}
                  className={cx(
                    "h-8 rounded-lg px-3.5 text-[13px] font-medium transition-colors",
                    brief.region === r ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
                  )}
                >
                  {REGIONS[r]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Audiences</Label>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_IDS.map((a) => (
                <Chip
                  key={a}
                  selected={brief.audiences.includes(a)}
                  onClick={() => setBrief({ audiences: toggle(brief.audiences, a) })}
                  title={AUDIENCES[a].hint}
                >
                  {AUDIENCES[a].label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_IDS.map((c) => (
                <Chip
                  key={c}
                  selected={brief.channels.includes(c)}
                  onClick={() => setBrief({ channels: toggle(brief.channels, c) })}
                >
                  <span className="size-2 rounded-full" style={{ background: CHANNELS[c].color }} />
                  {CHANNELS[c].label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>Tone</Label>
            <select
              value={brief.tone}
              onChange={(e) => setBrief({ tone: e.target.value })}
              aria-label="Tone"
              className="h-10 w-full rounded-xl border border-line-2 bg-surface px-3 text-sm"
            >
              {TONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-line pt-4">
            <Button size="lg" className="w-full" disabled={!ready || generating} onClick={generate}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {generating
                ? "Generating"
                : demo.assets.length > 0
                  ? "Regenerate the kit"
                  : `Generate ${planned} ${planned === 1 ? "draft" : "drafts"}`}
            </Button>
            {!ready && (
              <p className="mt-2 text-center text-xs text-muted">
                Add source material and pick at least one audience and channel.
              </p>
            )}
          </div>
        </Card>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-8">
                  <svg viewBox="0 0 320 60" className="mx-auto h-14 w-full max-w-md" fill="none" aria-hidden>
                    <path
                      pathLength={120}
                      d="M0 34h92l10-22 16 44 14-34 8 12h60l8-16 12 30 10-14h90"
                      stroke="var(--color-pulse)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="trace"
                    />
                  </svg>
                  <ol className="mx-auto mt-6 max-w-sm space-y-3" aria-live="polite">
                    {STEPS.map((label, i) => (
                      <li key={label} className="flex items-center gap-3 text-sm">
                        <span
                          className={cx(
                            "grid size-6 shrink-0 place-items-center rounded-full transition-colors",
                            i < step && "bg-good text-white",
                            i === step && "bg-brand text-white",
                            i > step && "bg-line text-faint",
                          )}
                        >
                          {i < step ? (
                            <Check className="size-3.5" strokeWidth={3} />
                          ) : i === step ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <span className="text-[11px] font-semibold">{i + 1}</span>
                          )}
                        </span>
                        <span className={cx(i > step ? "text-faint" : "text-text", i === step && "font-medium")}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </motion.div>
            ) : demo.assets.length > 0 ? (
              <motion.div key="kit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums leading-none">{demo.assets.length}</p>
                    <p className="mt-1 text-xs text-muted">drafts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums leading-none">{citations}</p>
                    <p className="mt-1 text-xs text-muted">cited claims</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums leading-none">
                      {new Set(demo.assets.map((a) => a.audience)).size}
                    </p>
                    <p className="mt-1 text-xs text-muted">audiences</p>
                  </div>
                  <Link
                    href="/review"
                    className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
                  >
                    Run the compliance check
                    <ArrowRight className="size-4" />
                  </Link>
                  {demo.note && <p className="w-full text-[13px] leading-relaxed text-muted">{demo.note}</p>}
                </Card>
                <div className="grid gap-4 lg:grid-cols-2">
                  {demo.assets.map((asset, i) => (
                    <AssetCard key={`${asset.id}-${asset.body.length}`} asset={asset} index={i} />
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">
                  Hover a reference such as <span className="font-mono">CL-101</span> to see the approved wording and
                  its source.
                </p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-6">
                  <h2 className="text-[15px] font-semibold">Approved claims library</h2>
                  <p className="mt-1 text-[13px] text-muted">
                    Drafts for this product can only use these statements. Anything else is flagged in Review.
                  </p>
                  <ul className="mt-4 divide-y divide-line">
                    {libraryClaims.map((claim) => {
                      const allowed = claim.regions.includes(brief.region);
                      return (
                        <li key={claim.id} className="flex gap-3 py-3">
                          <span className="mt-0.5 h-fit shrink-0 rounded-md bg-brand-soft px-1.5 py-px font-mono text-[11px] font-medium text-brand-dark">
                            {claim.id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cx("text-sm leading-snug", !allowed && "text-faint")}>{claim.text}</p>
                            <p className="mt-1 text-xs text-faint">{claim.reference}</p>
                          </div>
                          <Badge tone={allowed ? "good" : "bad"} className="h-fit">
                            {allowed ? `Approved in ${brief.region}` : `Not approved in ${brief.region}`}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
