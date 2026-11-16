export type ChannelId = "linkedin" | "x" | "facebook" | "youtube" | "email";
export type AudienceId = "ep" | "referring" | "admin" | "patient";
export type Region = "US" | "EU" | "JP";
export type AssetStatus = "draft" | "in_review" | "approved" | "scheduled" | "published";
export type ClaimTopic = "efficacy" | "efficiency" | "safety" | "mechanism" | "expanded";

export interface Claim {
  id: string;
  productId: string;
  topic: ClaimTopic;
  text: string;
  reference: string;
  regions: Region[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  trial: string;
  hashtag: string;
  safetyLine: string;
}

export interface Asset {
  id: string;
  channel: ChannelId;
  audience: AudienceId;
  title: string;
  body: string;
  status: AssetStatus;
  scheduledAt: string | null;
}

export interface Brief {
  campaignName: string;
  source: string;
  productId: string;
  region: Region;
  audiences: AudienceId[];
  channels: ChannelId[];
  tone: string;
}

export type Severity = "high" | "medium" | "low";

export interface Issue {
  id: string;
  assetId: string;
  severity: Severity;
  rule: string;
  title: string;
  detail: string;
  /** Text inside the asset body that the issue points at, when there is one. */
  excerpt?: string;
  fix?: { label: string; find?: string; replace?: string; append?: string };
}

export type GenerationSource = "claude" | "sample";
export type MlrState = "none" | "running" | "approved";
