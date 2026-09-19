import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { buildGeneratedApp } from "../builder.server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const apps = await prisma.generatedApp.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return {
    apps,
    appUrl: (process.env.SHOPIFY_APP_URL || new URL(request.url).origin).replace(/\/$/, ""),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  try {
    const app = await buildGeneratedApp({
      shop: session.shop,
      prompt: String(form.get("prompt") || ""),
      apiKey: String(form.get("apiKey") || "") || undefined,
    });
    return { ok: true, slug: app.slug, name: app.name };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not build the app.",
    };
  }
}

export default function AppBuilder() {
  const { apps, appUrl } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const building = navigation.state !== "idle";

  return (
    <s-page heading="Custom app builder">
      <s-section heading="Describe the companion app">
        <s-paragraph>
          Ribbit turns a prompt into a branded customer web app gated by the
          subscription license you already sell in Shopify.
        </s-paragraph>
        {result && !result.ok ? <s-banner tone="critical">{result.error}</s-banner> : null}
        {result?.ok ? (
          <s-banner tone="success">
            {result.name} is live.{" "}
            <s-link href={`${appUrl}/apps/${result.slug}`} target="_blank">
              Open the app
            </s-link>
          </s-banner>
        ) : null}
        <Form method="post">
          <s-stack direction="block" gap="base">
            <label>
              App prompt
              <textarea
                name="prompt"
                required
                minLength={12}
                defaultValue="Build a security companion for Lumen Cam owners with live camera status, smart alerts, event history, and a calm premium dark interface."
                rows={6}
                style={{ display: "block", width: "100%", marginTop: 8, padding: 12 }}
              />
            </label>
            <label>
              OpenAI API key (optional for demo mode)
              <input
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder="sk-…"
                style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
              />
            </label>
            <s-paragraph>
              The key is used once to generate the app and is never stored. Leave
              it blank to use Ribbit&apos;s instant demo template.
            </s-paragraph>
            <s-button
              type="submit"
              variant="primary"
              {...(building ? { loading: true } : {})}
            >
              Build web app
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section heading="Generated apps">
        {apps.length ? (
          <s-stack direction="block" gap="base">
            {apps.map((app) => (
              <s-box key={app.id} padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="inline" gap="base">
                  <s-text>{app.name}</s-text>
                  <s-link href={`${appUrl}/apps/${app.slug}`} target="_blank">
                    Preview
                  </s-link>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        ) : (
          <s-paragraph>No apps yet. Build the first one above.</s-paragraph>
        )}
      </s-section>

      <s-section slot="aside" heading="MVP stack">
        <s-paragraph>React Router · generated JSON spec · Ribbit license API</s-paragraph>
        <s-paragraph>
          No generated code executes on your server. Every app uses the same safe,
          responsive web runtime.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
