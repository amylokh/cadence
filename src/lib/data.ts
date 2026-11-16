import type { AudienceId, Brief, ChannelId, Claim, Product, Region } from "./types";

/*
 * Everything in this file is illustrative sample data. The products, the trial,
 * the numbers and the claims are invented for the prototype and describe no
 * real device or study. In production these come from the approved claims
 * library and the analytics warehouse.
 */

/** The prototype runs against a fixed "today" so every demo looks the same. */
export const TODAY = "2026-11-16";

export const PRODUCTS: Product[] = [
  {
    id: "volta",
    name: "Volta PFA System",
    category: "Pulsed field ablation",
    trial: "CLARITY-AF",
    hashtag: "#AFib #Electrophysiology",
    safetyLine: "Important Safety Information: example.com/volta-safety",
  },
  {
    id: "halo",
    name: "Halo LAAC Device",
    category: "Left atrial appendage closure",
    trial: "SHIELD-LAA",
    hashtag: "#AFib #StrokeRisk",
    safetyLine: "Important Safety Information: example.com/halo-safety",
  },
  {
    id: "meridian",
    name: "Meridian Coronary Stent",
    category: "Drug-eluting stent",
    trial: "MERIDIAN-1",
    hashtag: "#PCI #InterventionalCardiology",
    safetyLine: "Important Safety Information: example.com/meridian-safety",
  },
];

export const CLAIMS: Claim[] = [
  {
    id: "CL-101",
    productId: "volta",
    topic: "efficacy",
    text: "In the CLARITY-AF trial, 78.4% of patients treated with the Volta PFA System were free from atrial arrhythmia at 12 months.",
    reference: "CLARITY-AF primary results, 12-month follow-up (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-102",
    productId: "volta",
    topic: "efficiency",
    text: "Median procedure time was 62 minutes with the Volta PFA System, compared with 94 minutes for thermal ablation.",
    reference: "CLARITY-AF secondary endpoints (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-103",
    productId: "volta",
    topic: "safety",
    text: "The primary safety endpoint was met, with a serious adverse event rate of 2.1%.",
    reference: "CLARITY-AF safety analysis (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-104",
    productId: "volta",
    topic: "mechanism",
    text: "The Volta PFA System uses non-thermal pulsed electrical fields to ablate cardiac tissue.",
    reference: "Volta PFA System instructions for use (sample)",
    regions: ["US", "EU", "JP"],
  },
  {
    id: "CL-105",
    productId: "volta",
    topic: "expanded",
    text: "The Volta PFA System is also indicated for the treatment of persistent atrial fibrillation.",
    reference: "EU labelling, expanded indication (sample)",
    regions: ["EU"],
  },
  {
    id: "CL-201",
    productId: "halo",
    topic: "efficacy",
    text: "In the SHIELD-LAA trial, 96.2% of patients had effective appendage closure at 12 months.",
    reference: "SHIELD-LAA primary results (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-202",
    productId: "halo",
    topic: "efficiency",
    text: "Implant success was achieved in 98.1% of attempted procedures.",
    reference: "SHIELD-LAA procedural outcomes (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-203",
    productId: "halo",
    topic: "safety",
    text: "The primary safety endpoint was met, with a major complication rate of 1.4% at 7 days.",
    reference: "SHIELD-LAA safety analysis (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-204",
    productId: "halo",
    topic: "mechanism",
    text: "The Halo LAAC Device is designed to seal the left atrial appendage with a single implant.",
    reference: "Halo LAAC Device instructions for use (sample)",
    regions: ["US", "EU", "JP"],
  },
  {
    id: "CL-205",
    productId: "halo",
    topic: "expanded",
    text: "The Halo LAAC Device is also indicated for patients who can take oral anticoagulants.",
    reference: "EU labelling, expanded indication (sample)",
    regions: ["EU"],
  },
  {
    id: "CL-301",
    productId: "meridian",
    topic: "efficacy",
    text: "In the MERIDIAN-1 trial, target lesion failure at 12 months was 4.3%.",
    reference: "MERIDIAN-1 primary results (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-302",
    productId: "meridian",
    topic: "efficiency",
    text: "Device success was achieved in 97.6% of treated lesions.",
    reference: "MERIDIAN-1 procedural outcomes (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-303",
    productId: "meridian",
    topic: "safety",
    text: "Definite or probable stent thrombosis occurred in 0.4% of patients at 12 months.",
    reference: "MERIDIAN-1 safety analysis (sample)",
    regions: ["US", "EU"],
  },
  {
    id: "CL-304",
    productId: "meridian",
    topic: "mechanism",
    text: "The Meridian Coronary Stent pairs a thin-strut platform with a bioabsorbable polymer coating.",
    reference: "Meridian Coronary Stent instructions for use (sample)",
    regions: ["US", "EU", "JP"],
  },
  {
    id: "CL-305",
    productId: "meridian",
    topic: "expanded",
    text: "The Meridian Coronary Stent is also indicated for left main coronary lesions.",
    reference: "EU labelling, expanded indication (sample)",
    regions: ["EU"],
  },
];

export const claimById = (id: string) => CLAIMS.find((c) => c.id === id);
export const claimsFor = (productId: string) => CLAIMS.filter((c) => c.productId === productId);
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

export const CHANNELS: Record<
  ChannelId,
  { label: string; limit: number; color: string; format: string; bestFor: AudienceId[] }
> = {
  linkedin: { label: "LinkedIn", limit: 3000, color: "#2a78d6", format: "Post", bestFor: ["ep", "admin"] },
  x: { label: "X", limit: 280, color: "#eb6834", format: "Post", bestFor: ["ep"] },
  facebook: { label: "Facebook", limit: 2000, color: "#1baf7a", format: "Post", bestFor: ["patient"] },
  youtube: { label: "YouTube", limit: 5000, color: "#eda100", format: "Video script", bestFor: ["patient"] },
  email: { label: "Email", limit: 4000, color: "#e87ba4", format: "Rep email", bestFor: ["referring"] },
};
export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];

export const AUDIENCES: Record<AudienceId, { label: string; short: string; hint: string }> = {
  ep: { label: "Electrophysiologists", short: "EP", hint: "Clinical data, procedural detail" },
  referring: { label: "Referring cardiologists", short: "Referring", hint: "Who to refer and when" },
  admin: { label: "Hospital administrators", short: "Admin", hint: "Lab efficiency, economic value" },
  patient: { label: "Patients and caregivers", short: "Patient", hint: "Plain language, full safety info" },
};
export const AUDIENCE_IDS = Object.keys(AUDIENCES) as AudienceId[];

export const REGIONS: Record<Region, string> = { US: "United States", EU: "Europe", JP: "Japan" };

export const SAMPLE_ABSTRACT = `CLARITY-AF: Pulsed field versus thermal ablation for paroxysmal atrial fibrillation (sample abstract)

Background: Pulsed field ablation (PFA) delivers non-thermal energy to cardiac tissue. Comparative data against thermal ablation remain limited.

Methods: 706 patients with drug-refractory paroxysmal AF were randomised 1:1 to the Volta PFA System or thermal ablation at 42 centres. The primary efficacy endpoint was freedom from atrial arrhythmia at 12 months. The primary safety endpoint was a composite of serious adverse events.

Results: Freedom from atrial arrhythmia at 12 months was 78.4% with PFA and 71.2% with thermal ablation. Median procedure time was 62 minutes versus 94 minutes. Serious adverse events occurred in 2.1% and 2.4% of patients respectively, meeting the safety endpoint.

Conclusion: PFA was non-inferior to thermal ablation for efficacy and safety, with shorter procedures.`;

export const DEFAULT_BRIEF: Brief = {
  campaignName: "CLARITY-AF data launch",
  source: "",
  productId: "volta",
  region: "US",
  audiences: ["ep", "referring", "patient"],
  channels: ["linkedin", "x", "facebook", "email"],
  tone: "Clinical and confident",
};

export const TONES = ["Clinical and confident", "Warm and plain-spoken", "Concise and data-led"];

/* ---------- Plan screen ---------- */

export type Stage = "Plan" | "Create" | "Review" | "Deliver" | "Analyze";
export const STAGES: Stage[] = ["Plan", "Create", "Review", "Deliver", "Analyze"];

export const CAMPAIGNS: {
  id: string;
  name: string;
  productId: string;
  stage: Stage;
  owner: string;
  due: string;
  assets: number;
  region: Region;
}[] = [
  { id: "c1", name: "Halo patient awareness, Q1", productId: "halo", stage: "Plan", owner: "MR", due: "Jan 12", assets: 0, region: "US" },
  { id: "c2", name: "Meridian complex PCI series", productId: "meridian", stage: "Plan", owner: "JT", due: "Feb 02", assets: 0, region: "EU" },
  { id: "c3", name: "Volta lab efficiency story", productId: "volta", stage: "Create", owner: "SK", due: "Dec 04", assets: 6, region: "US" },
  { id: "c4", name: "Halo referral pathway emails", productId: "halo", stage: "Review", owner: "MR", due: "Nov 24", assets: 4, region: "US" },
  { id: "c5", name: "Meridian 12-month results", productId: "meridian", stage: "Review", owner: "JT", due: "Nov 27", assets: 9, region: "EU" },
  { id: "c6", name: "Volta physician training invites", productId: "volta", stage: "Deliver", owner: "SK", due: "Nov 19", assets: 5, region: "EU" },
  { id: "c7", name: "Halo congress recap", productId: "halo", stage: "Analyze", owner: "AP", due: "Done", assets: 12, region: "US" },
];

export const EVENTS = [
  { id: "e1", name: "Winter EP symposium", when: "Jan 2027", weeksOut: 9, focus: "volta" },
  { id: "e2", name: "Spring cardiology congress", when: "Mar 2027", weeksOut: 18, focus: "meridian" },
  { id: "e3", name: "Heart rhythm annual meeting", when: "May 2027", weeksOut: 26, focus: "volta" },
  { id: "e4", name: "European interventional course", when: "May 2027", weeksOut: 27, focus: "meridian" },
  { id: "e5", name: "Structural heart summit", when: "Jun 2027", weeksOut: 31, focus: "halo" },
];

/* ---------- Deliver screen ---------- */

export const TARGETING: Record<ChannelId, Partial<Record<AudienceId, string[]>> & { default: string[] }> = {
  linkedin: {
    ep: ["Job title: Electrophysiologist, Cardiologist", "Seniority: Senior and above", "Paid boost: specialty match"],
    admin: ["Job function: Healthcare administration", "Company type: Hospitals and health systems", "Paid boost: cath lab leadership"],
    default: ["Followers and employee advocates"],
  },
  x: { default: ["Followers of cardiology congress hashtags", "Organic, with physician reshares"] },
  facebook: {
    patient: ["Age 55+, interest in heart health", "Caregiver lookalike audience", "Excludes healthcare professionals"],
    default: ["Page followers"],
  },
  youtube: { default: ["Search: condition and treatment terms", "Patient education playlist"] },
  email: {
    referring: ["Opted-in referring cardiologists", "Sent by the territory representative", "Approved email template"],
    default: ["Opted-in contacts"],
  },
};

/** Suggested slots, as [days after TODAY, "HH:MM", reason]. */
export const SUGGESTED_SLOTS: Record<ChannelId, [number, string, string]> = {
  linkedin: [1, "07:30", "Physicians are most active before clinic"],
  x: [1, "12:15", "Midday peak for cardiology conversation"],
  email: [2, "06:45", "Opens are highest before rounds"],
  facebook: [3, "19:00", "Evening reach is highest for patients"],
  youtube: [4, "17:00", "Indexed ahead of weekend viewing"],
};

/** Posts already on the calendar from other campaigns. */
export const OTHER_SCHEDULED: { day: number; time: string; channel: ChannelId; label: string }[] = [
  { day: 0, time: "09:00", channel: "linkedin", label: "Halo referral pathway" },
  { day: 2, time: "13:00", channel: "x", label: "Meridian case of the week" },
  { day: 4, time: "08:00", channel: "email", label: "Training invite, wave 2" },
  { day: 8, time: "10:30", channel: "linkedin", label: "Meridian 12-month results" },
  { day: 10, time: "18:00", channel: "facebook", label: "Halo patient story" },
];

/* ---------- Analyze screen ---------- */

export const ANALYTICS_CHANNELS: ChannelId[] = ["linkedin", "x", "facebook", "youtube"];

/** Weekly engagements per channel over the last 12 weeks. */
export const WEEKLY_ENGAGEMENT = [
  { week: "Aug 31", linkedin: 2140, x: 980, facebook: 1320, youtube: 610 },
  { week: "Sep 7", linkedin: 2310, x: 1040, facebook: 1280, youtube: 640 },
  { week: "Sep 14", linkedin: 2260, x: 1010, facebook: 1410, youtube: 700 },
  { week: "Sep 21", linkedin: 2580, x: 1190, facebook: 1390, youtube: 690 },
  { week: "Sep 28", linkedin: 2740, x: 1820, facebook: 1450, youtube: 760 },
  { week: "Oct 5", linkedin: 2690, x: 1330, facebook: 1520, youtube: 810 },
  { week: "Oct 12", linkedin: 2950, x: 1280, facebook: 1490, youtube: 830 },
  { week: "Oct 19", linkedin: 3120, x: 1410, facebook: 1610, youtube: 900 },
  { week: "Oct 26", linkedin: 3380, x: 2240, facebook: 1580, youtube: 940 },
  { week: "Nov 2", linkedin: 3290, x: 1560, facebook: 1700, youtube: 1010 },
  { week: "Nov 9", linkedin: 3610, x: 1630, facebook: 1760, youtube: 1080 },
  { week: "Nov 16", linkedin: 3840, x: 1710, facebook: 1810, youtube: 1150 },
];

export const AUDIENCE_ENGAGEMENT: { audience: AudienceId; rate: number }[] = [
  { audience: "ep", rate: 6.8 },
  { audience: "referring", rate: 4.1 },
  { audience: "patient", rate: 3.4 },
  { audience: "admin", rate: 2.2 },
];

export const TOP_CONTENT: {
  title: string;
  channel: ChannelId;
  audience: AudienceId;
  impressions: number;
  rate: number;
  format: string;
}[] = [
  { title: "Procedure time: what 32 minutes means for a lab", channel: "linkedin", audience: "ep", impressions: 48200, rate: 8.9, format: "Data visual" },
  { title: "Live from the late-breaking session", channel: "x", audience: "ep", impressions: 36900, rate: 7.4, format: "Short video" },
  { title: "When to refer: a two-minute guide", channel: "email", audience: "referring", impressions: 9400, rate: 6.1, format: "Email" },
  { title: "What to expect on the day of your procedure", channel: "youtube", audience: "patient", impressions: 28700, rate: 4.8, format: "Explainer" },
  { title: "Living with AFib: questions to ask your doctor", channel: "facebook", audience: "patient", impressions: 41300, rate: 3.9, format: "Carousel" },
  { title: "Building the case for a PFA programme", channel: "linkedin", audience: "admin", impressions: 12800, rate: 2.6, format: "Article" },
];

export const INSIGHTS: { title: string; body: string; action: string; brief: Partial<Brief> }[] = [
  {
    title: "Data visuals outperform text for physicians",
    body: "LinkedIn posts for electrophysiologists that lead with one chart earn about twice the engagement of text-only posts.",
    action: "Draft a visual-led follow-up",
    brief: { campaignName: "CLARITY-AF data visual follow-up", audiences: ["ep"], channels: ["linkedin", "x"], tone: "Concise and data-led" },
  },
  {
    title: "Administrators are under-served",
    body: "Administrator content has the lowest engagement and only one piece this quarter. The lab efficiency claim has not been used for this audience.",
    action: "Draft an efficiency story",
    brief: { campaignName: "Lab efficiency for administrators", audiences: ["admin"], channels: ["linkedin", "email"], tone: "Concise and data-led" },
  },
  {
    title: "Congress weeks double X engagement",
    body: "Both spikes on X fall in congress weeks. The next one is nine weeks away, with no posts scheduled yet.",
    action: "Plan congress coverage",
    brief: { campaignName: "Winter EP symposium coverage", audiences: ["ep", "referring"], channels: ["x", "linkedin"], tone: "Clinical and confident" },
  },
];

export type CommentKind = "adverse" | "question" | "positive" | "offlabel";
export const COMMENTS: { id: string; channel: ChannelId; author: string; text: string; kind: CommentKind; why: string }[] = [
  {
    id: "m1",
    channel: "facebook",
    author: "Dana R.",
    text: "My father had this procedure in March and has had chest pain and shortness of breath ever since. Is that normal?",
    kind: "adverse",
    why: "Describes symptoms after a procedure with the product.",
  },
  {
    id: "m2",
    channel: "linkedin",
    author: "Dr. A. Mensah",
    text: "Encouraging 12-month numbers. Is there a subgroup analysis by left atrial size?",
    kind: "question",
    why: "Clinical question for medical affairs.",
  },
  {
    id: "m3",
    channel: "x",
    author: "@ep_fellow",
    text: "Has anyone used this for ventricular tachycardia cases yet?",
    kind: "offlabel",
    why: "Asks about a use outside the approved indication.",
  },
  {
    id: "m4",
    channel: "facebook",
    author: "Luis M.",
    text: "I felt dizzy for two weeks after mine and ended up back in hospital.",
    kind: "adverse",
    why: "Reports a hospitalisation after a procedure.",
  },
  {
    id: "m5",
    channel: "linkedin",
    author: "Priya S., RN",
    text: "Our lab team loved the workflow session last week. Thank you!",
    kind: "positive",
    why: "Positive feedback, no action needed.",
  },
];
