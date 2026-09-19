import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { parseAppSpec } from "../builder.server";
import prisma from "../db.server";
import { verifyContract } from "../ribbit.server";

async function generatedApp(slug: string | undefined) {
  if (!slug) throw new Response("Not found", { status: 404 });
  const app = await prisma.generatedApp.findUnique({ where: { slug } });
  if (!app) throw new Response("Not found", { status: 404 });
  return app;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const app = await generatedApp(params.slug);
  return {
    name: app.name,
    slug: app.slug,
    spec: parseAppSpec(app.specJson),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const app = await generatedApp(params.slug);
  const form = await request.formData();
  return verifyContract({
    shop: app.shop,
    email: String(form.get("email") || "").trim().toLowerCase(),
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `Account · ${data.name}` : "Companion account" },
];

const cardStyle = {
  padding: 22,
  borderRadius: 16,
  background: "#FFFFFF0D",
  border: "1px solid #FFFFFF14",
};

export default function GeneratedAppAccount() {
  const { slug, spec } = useLoaderData<typeof loader>();
  const verification = useActionData<typeof action>();
  const navigation = useNavigation();
  const account =
    verification?.valid === true && "account" in verification
      ? verification
      : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#F8FAFC",
        background: `radial-gradient(circle at 80% 0%, ${spec.accentColor}35, transparent 38%), ${spec.backgroundColor}`,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 72px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href={`/apps/${slug}`} style={{ color: "white", fontWeight: 750, textDecoration: "none" }}>
            {spec.name}
          </a>
          <span style={{ color: "#94A3B8", fontSize: 13 }}>Account · Powered by Ribbit</span>
        </header>

        <section style={{ padding: "72px 0 38px" }}>
          <div style={{ color: spec.accentColor, fontSize: 13, fontWeight: 700 }}>
            CUSTOMER ACCOUNT
          </div>
          <h1 style={{ fontSize: "clamp(38px, 7vw, 64px)", margin: "14px 0 12px" }}>
            Your subscription
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 18 }}>
            Live details connected from your completed Shopify checkout.
          </p>
        </section>

        {!account ? (
          <section
            style={{
              maxWidth: 560,
              padding: 28,
              border: "1px solid #334155",
              borderRadius: 20,
              background: "#0F172ACC",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Sign in with your checkout email</h2>
            <p style={{ color: "#94A3B8", lineHeight: 1.55 }}>
              Ribbit will find the active subscription attached to that account.
            </p>
            {verification && !verification.valid ? (
              <p style={{ color: "#FCA5A5" }}>No active order is connected to that email.</p>
            ) : null}
            <Form method="post" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Checkout email"
                style={{
                  flex: "1 1 270px",
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1px solid #475569",
                  background: "#020617",
                  color: "white",
                }}
              />
              <button
                type="submit"
                disabled={navigation.state !== "idle"}
                style={{
                  border: 0,
                  borderRadius: 10,
                  padding: "14px 20px",
                  color: "white",
                  background: spec.accentColor,
                  fontWeight: 700,
                }}
              >
                {navigation.state === "idle" ? "Open account" : "Connecting…"}
              </button>
            </Form>
            <p style={{ color: "#64748B", fontSize: 12, marginBottom: 0 }}>
              Demo: demo@lumen.example
            </p>
          </section>
        ) : (
          <>
            <div style={{ color: "#86EFAC", marginBottom: 22 }}>● Subscription active</div>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Account email</div>
                <strong style={{ display: "block", marginTop: 9 }}>{account.account.email}</strong>
              </article>
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Shopify order</div>
                <strong style={{ display: "block", marginTop: 9 }}>{account.order.reference}</strong>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 7, overflowWrap: "anywhere" }}>
                  {account.order.id || "Synthetic demo order"}
                </div>
              </article>
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Plan</div>
                <strong style={{ display: "block", marginTop: 9 }}>{account.plan.name}</strong>
                <div style={{ color: "#CBD5E1", marginTop: 6 }}>
                  ${(account.plan.price_cents / 100).toFixed(2)}/{account.plan.interval}
                </div>
              </article>
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Product</div>
                <strong style={{ display: "block", marginTop: 9 }}>
                  {account.product.title || "Lumen Cam + Guard Pro"}
                </strong>
              </article>
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Current period ends</div>
                <strong style={{ display: "block", marginTop: 9 }}>
                  {new Date(account.current_period_end).toLocaleDateString()}
                </strong>
              </article>
              <article style={cardStyle}>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>Seats</div>
                <strong style={{ display: "block", marginTop: 9 }}>
                  {account.seats.used} of {account.seats.included} in use
                </strong>
              </article>
            </section>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <h2 style={{ marginTop: 0 }}>Included with your plan</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {account.features.map((feature) => (
                  <span
                    key={feature}
                    style={{
                      padding: "8px 11px",
                      borderRadius: 999,
                      color: "#E2E8F0",
                      background: `${spec.accentColor}35`,
                      border: `1px solid ${spec.accentColor}65`,
                    }}
                  >
                    {feature.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
