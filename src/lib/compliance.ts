import { AUDIENCES, CHANNELS, REGIONS, claimById, productById } from "./data";
import type { Asset, Brief, Issue } from "./types";

/*
 * Pre-review checker. These are deterministic rules, not a model, so the same
 * draft always gets the same findings and every finding can be explained to a
 * reviewer. It runs on whatever text is in the asset, whether it was generated,
 * edited by hand, or pasted in.
 */

export const MARKER = /\[CL-\d{3}\]/g;
export const stripMarkers = (text: string) => text.replace(/\s*\[CL-\d{3}\]/g, "");

/** Sentences, each keeping the claim markers that follow it. */
export function sentences(body: string): string[] {
  return body
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?!\[CL-)|(?<=\[CL-\d{3}\])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

const SUPERLATIVES: [RegExp, string][] = [
  [/\bthe safest and most effective\b/i, "a clinically studied"],
  [/\bsafest\b/i, "well-studied"],
  [/\bmost effective\b/i, "effective"],
  [/\bbest-in-class\b/i, "established"],
  [/\b(breakthrough|revolutionary|game-changing|miracle)\b/i, "new"],
  [/\bguaranteed\b/i, "expected"],
  [/\brisk-free\b/i, "well-studied"],
  [/\bcure\b/i, "treatment"],
];

const STATISTIC = /\d+(\.\d+)?\s?%|\b\d+\s+(out of|in)\s+\d+\b/i;

export function checkAsset(asset: Asset, brief: Brief): Issue[] {
  const issues: Issue[] = [];
  const product = productById(brief.productId);
  const add = (issue: Omit<Issue, "id" | "assetId">) =>
    issues.push({ ...issue, id: `${asset.id}-${issue.rule}-${issues.length}`, assetId: asset.id });
  const units = sentences(asset.body);

  // 1. Promotional superlatives
  const flagged: string[] = [];
  for (const [pattern, replacement] of SUPERLATIVES) {
    const match = asset.body.match(pattern);
    if (!match || flagged.some((f) => f.toLowerCase().includes(match[0].toLowerCase()))) continue;
    flagged.push(match[0]);
    add({
      severity: "high",
      rule: "superlative",
      title: "Unsupported superlative",
      detail: `"${match[0]}" is a comparative claim with no approved evidence behind it.`,
      excerpt: match[0],
      fix: { label: `Replace with "${replacement}"`, find: match[0], replace: replacement },
    });
  }

  // 2. Claims: unknown, wrong product, or not approved in this region
  for (const marker of new Set(asset.body.match(MARKER) ?? [])) {
    const id = marker.slice(1, -1);
    const claim = claimById(id);
    const unit = units.find((u) => u.includes(marker));
    if (!claim || claim.productId !== product.id) {
      add({
        severity: "medium",
        rule: "unknown-claim",
        title: "Claim not in the approved library",
        detail: `${id} is not an approved claim for the ${product.name}.`,
        excerpt: unit,
        fix: unit ? { label: "Remove this sentence", find: unit, replace: "" } : undefined,
      });
    } else if (!claim.regions.includes(brief.region)) {
      add({
        severity: "high",
        rule: "region",
        title: `Not approved in ${REGIONS[brief.region]}`,
        detail: `${id} is approved only in ${claim.regions.map((r) => REGIONS[r]).join(", ")}. This campaign targets ${REGIONS[brief.region]}.`,
        excerpt: unit,
        fix: unit ? { label: "Remove this sentence", find: unit, replace: "" } : undefined,
      });
    }
  }

  // 3. Statistics with no claim behind them
  for (const unit of units) {
    if (STATISTIC.test(unit) && !unit.match(MARKER)) {
      add({
        severity: "medium",
        rule: "uncited",
        title: "Statistic with no source",
        detail: "This number is not tied to an approved claim, so a reviewer cannot verify it.",
        excerpt: unit,
        fix: { label: "Remove this sentence", find: unit, replace: "" },
      });
    }
  }

  // 4. Safety information
  if (!/important safety information/i.test(asset.body)) {
    const patient = asset.audience === "patient";
    add({
      severity: patient ? "high" : "medium",
      rule: "safety",
      title: "Safety information missing",
      detail: patient
        ? "Patient-facing content must carry the safety information."
        : `Content for ${AUDIENCES[asset.audience].label.toLowerCase()} should link to the safety information.`,
      fix: { label: "Add the safety line", append: product.safetyLine },
    });
  }

  // 5. Channel length
  const length = stripMarkers(asset.body).length;
  const limit = CHANNELS[asset.channel].limit;
  if (length > limit) {
    add({
      severity: "low",
      rule: "length",
      title: "Over the channel limit",
      detail: `${length} characters; ${CHANNELS[asset.channel].label} allows ${limit}. Shorten the copy before publishing.`,
    });
  }

  return issues;
}

export function applyFix(body: string, issue: Issue): string {
  const fix = issue.fix;
  if (!fix) return body;
  let next = body;
  if (fix.find !== undefined) next = next.replace(fix.find, fix.replace ?? "");
  if (fix.append) next = `${next.trimEnd()}\n\n${fix.append}`;
  return next
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 0 to 100. Any high-severity issue keeps an asset out of review. */
export function readiness(issues: Issue[]): number {
  const cost = { high: 35, medium: 15, low: 5 };
  return Math.max(0, 100 - issues.reduce((sum, i) => sum + cost[i.severity], 0));
}

export const blocking = (issues: Issue[]) => issues.filter((i) => i.severity === "high").length;
