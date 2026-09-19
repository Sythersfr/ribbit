import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { parseAppSpec } from "../builder.server";
import prisma from "../db.server";
import { verifyContract } from "../sidecar.server";

async function generatedApp(slug: string | undefined) {
  if (!slug) throw new Response("Not found", { status: 404 });
  const app = await prisma.generatedApp.findUnique({ where: { slug } });
  if (!app) throw new Response("Not found", { status: 404 });
  return app;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const app = await generatedApp(params.slug);
  return { name: app.name, spec: parseAppSpec(app.specJson) };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const app = await generatedApp(params.slug);
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();

  return verifyContract({
    shop: app.shop,
    email,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `${data.name} · Powered by Ribbit` : "Ribbit app" },
];

export default function GeneratedWebApp() {
  const { spec } = useLoaderData<typeof loader>();
  const verification = useActionData<typeof action>();
  const navigation = useNavigation();
  const unlocked = verification?.valid === true;

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#F8FAFC",
        background: `radial-gradient(circle at 80% 0%, ${spec.accentColor}35, transparent 38%), ${spec.backgroundColor}`,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 72px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 20 }}>{spec.name}</strong>
          <span style={{ color: "#94A3B8", fontSize: 13 }}>Powered by Ribbit</span>
        </header>

        <section style={{ padding: "96px 0 64px", maxWidth: 760 }}>
          <div
            style={{
              display: "inline-block",
              color: spec.accentColor,
              border: `1px solid ${spec.accentColor}70`,
              borderRadius: 999,
              padding: "7px 12px",
              fontSize: 13,
            }}
          >
            Premium companion app
          </div>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 76px)", lineHeight: 1, margin: "24px 0 20px" }}>
            {spec.tagline}
          </h1>
          <p style={{ color: "#CBD5E1", fontSize: 19, lineHeight: 1.65, maxWidth: 680 }}>
            {spec.description}
          </p>
        </section>

        {!unlocked ? (
          <section
            style={{
              maxWidth: 560,
              padding: 28,
              border: "1px solid #334155",
              borderRadius: 20,
              background: "#0F172ACC",
              boxShadow: "0 24px 80px #00000055",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Sign in to your account</h2>
            <p style={{ color: "#94A3B8", lineHeight: 1.5 }}>
              Use the same email address you entered at checkout to unlock {spec.name}.
            </p>
            {verification && !verification.valid ? (
              <p style={{ color: "#FCA5A5" }}>
                We could not find an active subscription for that email.
              </p>
            ) : null}
            <Form method="post" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Checkout email"
                style={{
                  flex: "1 1 260px",
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
                  cursor: "pointer",
                }}
              >
                {navigation.state === "idle" ? "Sign in" : "Checking…"}
              </button>
            </Form>
            <p style={{ color: "#64748B", fontSize: 12, marginBottom: 0 }}>
              Demo account: demo@lumen.example
            </p>
          </section>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                marginBottom: 18,
              }}
            >
              {spec.metrics.map((metric) => (
                <article
                  key={metric.label}
                  style={{ padding: 22, borderRadius: 16, background: "#FFFFFF0D", border: "1px solid #FFFFFF14" }}
                >
                  <div style={{ color: "#94A3B8", fontSize: 13 }}>{metric.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 750, marginTop: 8 }}>{metric.value}</div>
                </article>
              ))}
            </section>
            <div style={{ color: "#86EFAC", marginBottom: 28 }}>● Subscription active</div>
          </>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginTop: 42,
          }}
        >
          {spec.features.map((feature) => (
            <article
              key={feature.title}
              style={{ padding: 24, borderRadius: 16, background: "#FFFFFF08", border: "1px solid #FFFFFF10" }}
            >
              <h3>{feature.title}</h3>
              <p style={{ color: "#94A3B8", lineHeight: 1.55 }}>{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
