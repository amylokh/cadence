import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { AUDIENCES, CHANNELS, REGIONS, claimsFor, productById } from "@/lib/data";
import { generateSampleKit, pairingsFor, titleFor } from "@/lib/generator";
import type { Asset, Brief, GenerationSource } from "@/lib/types";

/*
 * Drafts a campaign kit. With Claude credentials in the environment
 * (ANTHROPIC_API_KEY) the drafts are written by Claude from the source material
 * and the approved claims library. Without them, or if the call fails, the
 * built-in sample generator answers instead so the demo never dead-ends.
 */

const BriefSchema = z.object({
  campaignName: z.string().max(200),
  source: z.string().max(60_000),
  productId: z.string(),
  region: z.enum(["US", "EU", "JP"]),
  audiences: z.array(z.enum(["ep", "referring", "admin", "patient"])).min(1),
  channels: z.array(z.enum(["linkedin", "x", "facebook", "youtube", "email"])).min(1),
  tone: z.string().max(100),
});

const KitSchema = z.object({
  assets: z.array(
    z.object({
      channel: z.enum(["linkedin", "x", "facebook", "youtube", "email"]),
      audience: z.enum(["ep", "referring", "admin", "patient"]),
      body: z.string(),
    }),
  ),
});

type Result = { assets: Asset[]; source: GenerationSource; note: string | null };

const sample = (brief: Brief, note: string): Result => ({
  assets: generateSampleKit(brief),
  source: "sample",
  note,
});

function systemPrompt(brief: Brief): string {
  const product = productById(brief.productId);
  const library = claimsFor(product.id)
    .map((c) => `${c.id} (approved in ${c.regions.join(", ")}): ${c.text}`)
    .join("\n");

  return `You draft marketing content for a medical device company's cardiovascular team. Your drafts go to a medical, legal and regulatory review before anything is published, and the reviewers reject content that makes a claim they cannot trace to an approved source. Your job is to give them drafts they can approve on the first pass.

Product: ${product.name} (${product.category}).
Target region: ${REGIONS[brief.region]}.

Approved claims library. These are the only factual or clinical statements you may make about the product:
${library}

How to use the library:
- State a claim in its approved wording, or a close paraphrase that changes no number and adds no meaning. Put its reference in square brackets directly after the sentence, like this: "... at 12 months. [CL-101]"
- Use only claims approved in the target region. A claim approved elsewhere is off-limits for this campaign, even if the source material mentions it.
- The source material tells you what the campaign is about and which claims matter most. It is not itself an approved source: if it contains a figure or statement that is not in the library, leave it out.
- No superlatives or comparative promises (safest, best, most effective, breakthrough, guaranteed), because none are supported by the library.

Every draft ends with this line on its own, exactly as written, because all promotional content must carry the safety information:
${product.safetyLine}

Write each draft for its channel and reader. Stay within the channel's character limit, counting the safety line. Patients and caregivers need plain language with no jargon and a prompt to talk to their doctor; physicians want the data and its clinical meaning; administrators want operational relevance. An email starts with a "Subject:" line. A YouTube draft is a short narrated video script. Plain text only, with blank lines between paragraphs and no markdown.`;
}

function userPrompt(brief: Brief): string {
  const drafts = pairingsFor(brief)
    .map(
      ({ channel, audience }) =>
        `- channel "${channel}" (${CHANNELS[channel].label} ${CHANNELS[channel].format.toLowerCase()}, up to ${CHANNELS[channel].limit} characters) for audience "${audience}" (${AUDIENCES[audience].label}: ${AUDIENCES[audience].hint.toLowerCase()})`,
    )
    .join("\n");

  return `Campaign: ${brief.campaignName}
Tone: ${brief.tone}

Write one draft for each of these, and no others:
${drafts}

<source_material>
${brief.source}
</source_material>`;
}

export async function POST(request: Request) {
  const parsed = BriefSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "The brief is incomplete or malformed." }, { status: 400 });
  }
  const brief: Brief = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      sample(
        brief,
        "Sample generator: these drafts are assembled from the approved claims library and include typical first-draft problems for the checker to find. Add an ANTHROPIC_API_KEY to have Claude write them from your source material.",
      ),
    );
  }

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // If a safety classifier declines the request, the API retries it on a
      // fallback model inside the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemPrompt(brief),
      messages: [{ role: "user", content: userPrompt(brief) }],
      // Short marketing copy from a fixed library: low effort keeps the wait short.
      output_config: { effort: "low", format: betaZodOutputFormat(KitSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json(
        sample(brief, "Claude did not return drafts for this brief, so these come from the sample generator."),
      );
    }

    const assets: Asset[] = response.parsed_output.assets.map((draft, index) => ({
      id: `a${index + 1}-${draft.channel}-${draft.audience}`,
      channel: draft.channel,
      audience: draft.audience,
      title: titleFor(draft.channel, draft.audience),
      body: draft.body.trim(),
      status: "draft",
      scheduledAt: null,
    }));
    const result: Result = { assets, source: "claude", note: null };
    return Response.json(result);
  } catch (error) {
    let reason = "The call to Claude failed";
    if (error instanceof Anthropic.AuthenticationError) reason = "The Claude API key was rejected";
    else if (error instanceof Anthropic.RateLimitError) reason = "The Claude API rate limit was reached";
    else if (error instanceof Anthropic.APIConnectionError) reason = "Claude could not be reached";
    else if (error instanceof Anthropic.APIError) reason = `Claude returned an error (${error.status})`;
    console.error("Kit generation failed:", error);
    return Response.json(sample(brief, `${reason}, so these drafts come from the sample generator.`));
  }
}
