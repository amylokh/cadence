import { AUDIENCES, CHANNELS, claimsFor, productById } from "./data";
import type { Asset, AudienceId, Brief, ChannelId, ClaimTopic } from "./types";

/*
 * Sample generator, used when no Claude credentials are configured. It builds
 * drafts from the approved claims library, and deliberately leaves in the kind
 * of first-draft problems a reviewer would catch (a superlative, a statistic
 * with no source, a claim that is not approved in the region, missing safety
 * information) so the Review screen has something real to find.
 */

const CONDITION: Record<string, string> = {
  volta: "an irregular heartbeat",
  halo: "atrial fibrillation",
  meridian: "narrowed heart arteries",
};

/** Which audiences each channel is written for, given what the brief selected. */
export function pairingsFor(brief: Brief): { channel: ChannelId; audience: AudienceId }[] {
  const pairs: { channel: ChannelId; audience: AudienceId }[] = [];
  for (const channel of brief.channels) {
    const matched = CHANNELS[channel].bestFor.filter((a) => brief.audiences.includes(a));
    const audiences = matched.length > 0 ? matched : brief.audiences.slice(0, 1);
    for (const audience of audiences) pairs.push({ channel, audience });
  }
  return pairs;
}

export function titleFor(channel: ChannelId, audience: AudienceId): string {
  const who = AUDIENCES[audience].label.toLowerCase();
  if (channel === "youtube") return `Explainer video script for ${who}`;
  if (channel === "email") return `Representative email for ${who}`;
  return `${CHANNELS[channel].label} post for ${who}`;
}

export function generateSampleKit(brief: Brief): Asset[] {
  const product = productById(brief.productId);
  const claims = claimsFor(product.id);
  const cite = (topic: ClaimTopic) => {
    const claim = claims.find((c) => c.topic === topic);
    return claim ? `${claim.text} [${claim.id}]` : "";
  };
  const link = (slug: string) => `example.com/${product.id}-${slug}`;
  const condition = CONDITION[product.id] ?? "a heart condition";

  const write = (channel: ChannelId, audience: AudienceId): string => {
    const key = `${channel}/${audience}`;
    switch (key) {
      case "linkedin/ep":
        return [
          `New 12-month data from the ${product.trial} trial.`,
          `${cite("efficacy")} ${cite("efficiency")}`,
          cite("safety"),
          `For many labs, this makes the ${product.name} the safest and most effective option available today.`,
          `Read the full results and see what they could mean for your practice: ${link("data")}`,
          product.safetyLine,
          product.hashtag,
        ].join("\n\n");
      case "linkedin/admin":
        return [
          `What do the latest ${product.trial} results mean for a cardiology service line?`,
          `${cite("efficiency")} ${cite("mechanism")}`,
          "Consistent, predictable procedures can help teams plan lab time with more confidence. Our health economics team can walk through the data with you.",
          `Request a briefing: ${link("value")}`,
          product.safetyLine,
        ].join("\n\n");
      case "facebook/patient":
        return [
          `Living with ${condition} can be tiring and worrying. You are not alone.`,
          `The ${product.name} is a treatment option your heart doctor may discuss with you. ${cite("mechanism")}`,
          "9 out of 10 patients say they would recommend the procedure to a friend.",
          `Ask your doctor whether it could be right for you: ${link("patients")}`,
        ].join("\n\n");
      case "youtube/patient":
        return [
          "VIDEO SCRIPT, about 90 seconds",
          `Scene 1, a patient at home. Narrator: If you are living with ${condition}, your doctor may have talked to you about treatment options.`,
          `Scene 2, animation of the device. Narrator: ${cite("mechanism")}`,
          "Scene 3, doctor and patient talking. Narrator: Every procedure has risks. Your doctor can explain whether this treatment is right for you.",
          `End card: ${product.safetyLine}`,
        ].join("\n\n");
      case "email/referring":
        return [
          `Subject: ${product.trial} results and which patients to consider referring`,
          "Dear Dr. [Last name],",
          `The 12-month results of the ${product.trial} trial are now available, and I wanted to share the main findings.`,
          `${cite("efficacy")}\n${cite("safety")}`,
          "If you see patients who remain symptomatic on current therapy, I would be glad to arrange a conversation with our clinical team.",
          "Kind regards,\n[Representative name]",
          product.safetyLine,
        ].join("\n\n");
      default:
        if (channel === "x") {
          return [`${cite("efficacy")} ${cite("expanded")}`, product.safetyLine].join("\n\n");
        }
        return [
          `${cite("efficacy")} ${cite("safety")}`,
          `Learn more: ${link("data")}`,
          product.safetyLine,
        ].join("\n\n");
    }
  };

  return pairingsFor(brief).map(({ channel, audience }, index) => ({
    id: `a${index + 1}-${channel}-${audience}`,
    channel,
    audience,
    title: titleFor(channel, audience),
    body: write(channel, audience),
    status: "draft",
    scheduledAt: null,
  }));
}
