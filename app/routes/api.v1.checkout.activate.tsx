import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { mintContract } from "../sidecar.server";

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { sessionToken, cors } = await authenticate.public.checkout(request);
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const orderId = String(body.orderId || "");

  if (!email.includes("@") || !orderId.startsWith("gid://shopify/Order/")) {
    return cors(json({ ok: false, error: "invalid_account_details" }, 400));
  }

  const shop = new URL(String(sessionToken.dest)).hostname;
  const contract = await mintContract({
    shop,
    email,
    shopifyOrderId: orderId,
    productTitle: "Lumen Cam + Guard Pro",
  });

  return cors(
    json({
      ok: true,
      email: contract.email,
    }),
  );
}

export async function loader({ request }: ActionFunctionArgs) {
  const { cors } = await authenticate.public.checkout(request);
  return cors(json({ ok: true }));
}
