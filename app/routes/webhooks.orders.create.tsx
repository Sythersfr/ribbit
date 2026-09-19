import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ensureShopSetup, mintContract } from "../sidecar.server";
import prisma from "../db.server";

type OrderPayload = {
  id?: number | string;
  email?: string;
  contact_email?: string;
  line_items?: Array<{
    product_id?: number;
    title?: string;
    sku?: string;
  }>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const order = payload as OrderPayload;
  const { plan } = await ensureShopSetup(shop);
  const credential = await prisma.shopCredential.findUnique({ where: { shop } });
  const items = order.line_items ?? [];

  const camNumeric = plan.productGid?.split("/").pop();
  const guardNumeric = credential?.guardProductGid?.split("/").pop();

  const shouldMint = items.some((item) => {
    const productId = String(item.product_id || "");
    const sku = (item.sku || "").toUpperCase();
    const title = (item.title || "").toLowerCase();
    return (
      sku === "RIBBIT-GUARD" ||
      sku === "SIDECAR-GUARD" ||
      title.includes("guard pro") ||
      (guardNumeric && productId === guardNumeric) ||
      (camNumeric && productId === camNumeric)
    );
  });

  if (!shouldMint) {
    return new Response();
  }

  const email = order.email || order.contact_email || "buyer@lumen.example";
  const hardware = items.find((item) =>
    String(item.product_id || "") === camNumeric,
  );
  await mintContract({
    shop,
    email,
    shopifyOrderId: String(order.id || ""),
    productGid: plan.productGid || undefined,
    productTitle: hardware?.title || "Lumen Cam + Guard Pro",
  });

  return new Response();
};
