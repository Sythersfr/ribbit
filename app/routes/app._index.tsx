import { useEffect, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { checkoutUrlFor, seedCheckoutCatalog } from "../catalog.server";
import { ensureShopSetup, ltvMetrics, mintContractsFromRecentOrders } from "../sidecar.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { credential, plan } = await ensureShopSetup(session.shop);
  const metrics = ltvMetrics(24900, plan.priceCents, 0.42);
  const appUrl = (process.env.SHOPIFY_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  return {
    shop: session.shop,
    apiKey: credential.apiKey,
    plan,
    metrics,
    seedLicense: "RBT-GUARD-9K2P",
    appUrl,
    checkoutUrl: checkoutUrlFor(
      session.shop,
      credential.camVariantNumeric,
      credential.guardVariantNumeric,
      credential.sellingPlanNumeric,
    ),
    storeUrl: `https://${session.shop}`,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "seed");
  try {
    if (intent === "sync") {
      const minted = await mintContractsFromRecentOrders(admin, session.shop);
      return { ok: true, minted };
    }
    const catalog = await seedCheckoutCatalog(admin, session.shop);
    return { ok: true, ...catalog };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const orderSync = useFetcher<typeof action>();
  const { state: orderSyncStatus, submit: submitOrderSync } = orderSync;
  const orderSyncState = useRef(orderSyncStatus);
  const navigation = useNavigation();
  const seeding = navigation.state !== "idle";
  const [license, setLicense] = useState(data.seedLicense);
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const checkoutUrl = actionData && "checkoutUrl" in actionData ? actionData.checkoutUrl : data.checkoutUrl;
  const syncedLicenses =
    orderSync.data && "minted" in orderSync.data ? orderSync.data.minted : [];

  useEffect(() => {
    orderSyncState.current = orderSyncStatus;
  }, [orderSyncStatus]);

  useEffect(() => {
    const sync = () => {
      if (orderSyncState.current === "idle") {
        submitOrderSync({ intent: "sync" }, { method: "post" });
      }
    };
    const first = window.setTimeout(sync, 1_000);
    const interval = window.setInterval(sync, 5_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [submitOrderSync]);

  const verify = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/contracts/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ license_key: license }),
      });
      const json = await response.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (error) {
      setResult(String(error));
    } finally {
      setBusy(false);
    }
  };

  const curl = `curl -X POST ${data.appUrl}/api/v1/contracts/verify \\
  -H "Authorization: Bearer ${data.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"license_key":"${data.seedLicense}"}'`;

  return (
    <s-page heading="Ribbit">
      <s-section heading="Live checkout demo">
        <s-paragraph>
          Seed the Lumen Cam + Guard Pro bundle. Checkout includes the camera
          once and Guard Pro as a <s-text>$12/month subscription</s-text>.
        </s-paragraph>
        {actionData && "error" in actionData && actionData.error ? (
          <s-banner tone="critical">{actionData.error}</s-banner>
        ) : null}
        {actionData && "minted" in actionData && actionData.minted ? (
          <s-banner tone="success">
            {actionData.minted.length
              ? actionData.minted.join(" · ")
              : "No matching Lumen orders yet. Complete checkout first."}
          </s-banner>
        ) : null}
        {syncedLicenses?.length ? (
          <s-banner tone="success">
            Auto-issued {syncedLicenses.join(" · ")}
          </s-banner>
        ) : null}
        <s-stack direction="inline" gap="base">
          <Form method="post">
            <input type="hidden" name="intent" value="seed" />
            <s-button
              type="submit"
              variant="primary"
              {...(seeding ? { loading: true } : {})}
            >
              Prepare store catalog
            </s-button>
          </Form>
          {checkoutUrl ? (
            <s-link href={checkoutUrl} target="_blank">
              Open bundled checkout
            </s-link>
          ) : null}
          <s-link href={data.storeUrl} target="_blank">
            Open storefront
          </s-link>
          <Form method="post">
            <input type="hidden" name="intent" value="sync" />
            <s-button type="submit" {...(seeding ? { loading: true } : {})}>
              Import licenses from orders
            </s-button>
          </Form>
        </s-stack>
        <s-paragraph>
          Checkout test card: number <s-text>1</s-text>, any future expiry, any
          CVV, any name. If the store asks for a password, use the Online Store
          password from Shopify admin → Online Store → Preferences.
        </s-paragraph>
        <s-paragraph>
          <s-text>
            {orderSyncStatus === "idle"
              ? "Auto-sync active · checking orders every 5 seconds"
              : "Checking Shopify for new orders…"}
          </s-text>
        </s-paragraph>
      </s-section>

      <s-section heading="Done-for-you contract verification">
        <s-paragraph>
          Attach a companion app plan to a physical SKU. Your software never
          talks to Shopify — it asks Ribbit if the contract is live.
        </s-paragraph>
      </s-section>

      <s-section heading="Your API key">
        <s-paragraph>
          <s-text>{data.apiKey}</s-text>
        </s-paragraph>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            <code>{curl}</code>
          </pre>
        </s-box>
      </s-section>

      <s-section heading="Verify playground">
        <s-stack direction="block" gap="base">
          <label>
            License key
            <input
              value={license}
              onChange={(event) => setLicense(event.target.value)}
              style={{ display: "block", width: "100%", marginTop: 8, padding: 8 }}
            />
          </label>
          <s-button
            variant="primary"
            onClick={verify}
            {...(busy ? { loading: true } : {})}
          >
            Verify live contract
          </s-button>
          {result ? (
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                <code>{result}</code>
              </pre>
            </s-box>
          ) : null}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="LTV lift">
        <s-paragraph>
          Hardware only: ${(data.metrics.hardwareOnly / 100).toFixed(0)}
        </s-paragraph>
        <s-paragraph>
          With Guard Pro (12 mo): $
          {(data.metrics.sidecarYear / 100).toFixed(0)}
        </s-paragraph>
        <s-paragraph>
          Extra LTV: ${(data.metrics.lift / 100).toFixed(0)} · attach demo{" "}
          {Math.round(data.metrics.attachRate * 100)}%
        </s-paragraph>
        <s-paragraph>
          Plan: {data.plan.name} · ${data.plan.priceCents / 100}/
          {data.plan.interval}
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
