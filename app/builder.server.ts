import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import prisma from "./db.server";

export const appSpecSchema = z.object({
  name: z.string().min(2).max(48),
  tagline: z.string().min(4).max(90),
  description: z.string().min(10).max(260),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  ctaLabel: z.string().min(2).max(32),
  features: z
    .array(
      z.object({
        title: z.string().min(2).max(42),
        description: z.string().min(6).max(140),
      }),
    )
    .min(3)
    .max(4),
  metrics: z
    .array(
      z.object({
        label: z.string().min(2).max(28),
        value: z.string().min(1).max(16),
      }),
    )
    .length(3),
});

export type AppSpec = z.infer<typeof appSpecSchema>;

function fallbackSpec(prompt: string): AppSpec {
  const normalized = prompt.trim().replace(/\s+/g, " ");
  const topic = normalized.split(/[.!?]/)[0]?.slice(0, 65) || "Smart companion app";
  return {
    name: "Lumen Companion",
    tagline: "Your product, smarter every day",
    description: topic,
    accentColor: "#7C3AED",
    backgroundColor: "#09090B",
    ctaLabel: "Open dashboard",
    features: [
      { title: "Live dashboard", description: "See the status of every connected product at a glance." },
      { title: "Smart alerts", description: "Receive clear, useful updates when something needs attention." },
      { title: "Subscription access", description: "Premium tools unlock instantly with a valid Ribbit license." },
    ],
    metrics: [
      { label: "Devices online", value: "3" },
      { label: "Events today", value: "18" },
      { label: "Status", value: "Secure" },
    ],
  };
}

async function createSpec(prompt: string, apiKey?: string) {
  if (!apiKey) return fallbackSpec(prompt);

  const openai = createOpenAI({ apiKey });
  const result = await generateText({
    model: openai("gpt-4.1-mini"),
    output: Output.object({ schema: appSpecSchema }),
    instructions:
      "Design a polished but simple customer-facing companion web app. Return concise product copy only. Do not include code, HTML, scripts, URLs, or markdown. Make it feel specific to the merchant prompt.",
    prompt: `Create a web app from this merchant brief:\n\n${prompt.slice(0, 2000)}`,
    maxRetries: 1,
  });
  return result.output;
}

function appSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${base || "app"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function buildGeneratedApp(input: {
  shop: string;
  prompt: string;
  apiKey?: string;
}) {
  const prompt = input.prompt.trim();
  if (prompt.length < 12) {
    throw new Error("Describe the app in at least 12 characters.");
  }

  const spec = await createSpec(prompt, input.apiKey?.trim());
  return prisma.generatedApp.create({
    data: {
      shop: input.shop,
      slug: appSlug(spec.name),
      name: spec.name,
      prompt,
      specJson: JSON.stringify(spec),
    },
  });
}

export function parseAppSpec(specJson: string) {
  return appSpecSchema.parse(JSON.parse(specJson));
}
