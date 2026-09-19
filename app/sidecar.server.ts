import prisma from "./db.server";

const FEATURES = ["ai_alerts", "multi_cam", "cloud_archive"];

function randomSuffix(length = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function generateLicenseKey() {
  return `RBT-GUARD-${randomSuffix(4)}`;
}

export async function ensureShopSetup(shop: string) {
  let credential = await prisma.shopCredential.findUnique({ where: { shop } });
  if (!credential) {
    credential = await prisma.shopCredential.create({
      data: {
        shop,
        apiKey: `sk_live_${shop.replace(".myshopify.com", "").replace(/[^a-z0-9]/gi, "_")}_${randomSuffix(8).toLowerCase()}`,
      },
    });
  }

  let plan = await prisma.companionPlan.findFirst({
    where: { shop, handle: "guard_pro" },
  });
  if (!plan) {
    plan = await prisma.companionPlan.create({
      data: {
        shop,
        name: "Lumen Guard Pro",
        handle: "guard_pro",
        priceCents: 1200,
        interval: "month",
        seats: 3,
        featuresJson: JSON.stringify(FEATURES),
      },
    });
  }

  const existingSeed = await prisma.contract.findFirst({
    where: { shop, licenseKey: "RBT-GUARD-9K2P" },
  });
  if (!existingSeed) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.contract.create({
      data: {
        shop,
        licenseKey: "RBT-GUARD-9K2P",
        email: "demo@lumen.example",
        status: "active",
        planId: plan.id,
        productTitle: "Lumen Cam",
        seatsIncluded: plan.seats,
        seatsUsed: 1,
        periodEnd,
      },
    });
  }

  return { credential, plan };
}

export async function getCredentialByKey(apiKey: string) {
  return prisma.shopCredential.findUnique({ where: { apiKey } });
}

export async function verifyContract(input: {
  shop: string;
  licenseKey?: string;
  email?: string;
}) {
  const where = input.licenseKey
    ? { licenseKey: input.licenseKey }
    : input.email
      ? { shop_email: { shop: input.shop, email: input.email } }
      : null;

  if (!where) {
    return {
      valid: false,
      reason: "missing_identifier",
      message: "Pass license_key or email.",
    };
  }

  const contract = input.licenseKey
    ? await prisma.contract.findUnique({
        where: { licenseKey: input.licenseKey },
        include: { plan: true },
      })
    : await prisma.contract.findFirst({
        where: { shop: input.shop, email: input.email },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

  if (!contract || contract.shop !== input.shop) {
    return { valid: false, reason: "not_found" };
  }

  if (contract.status !== "active") {
    return {
      valid: false,
      reason: contract.status,
      contract_id: contract.id,
      status: contract.status,
    };
  }

  return {
    valid: true,
    status: contract.status,
    contract_id: contract.id,
    license_key: contract.licenseKey,
    plan: {
      id: contract.plan.handle,
      name: contract.plan.name,
      interval: contract.plan.interval,
      price_cents: contract.plan.priceCents,
    },
    seats: { included: contract.seatsIncluded, used: contract.seatsUsed },
    features: JSON.parse(contract.plan.featuresJson) as string[],
    product: {
      gid: contract.productGid,
      title: contract.productTitle,
    },
    current_period_end: contract.periodEnd.toISOString(),
  };
}

export async function attachPlanToProduct(shop: string, productGid: string) {
  const { plan } = await ensureShopSetup(shop);
  return prisma.companionPlan.update({
    where: { id: plan.id },
    data: { productGid },
  });
}

export async function mintContract(input: {
  shop: string;
  email: string;
  productGid?: string;
  productTitle?: string;
  shopifyOrderId?: string;
}) {
  const { plan } = await ensureShopSetup(input.shop);
  if (input.shopifyOrderId) {
    const existing = await prisma.contract.findUnique({
      where: { shopifyOrderId: input.shopifyOrderId },
      include: { plan: true },
    });
    if (existing) return existing;
  }
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return prisma.contract.create({
    data: {
      shop: input.shop,
      shopifyOrderId: input.shopifyOrderId,
      licenseKey: generateLicenseKey(),
      email: input.email,
      status: "active",
      planId: plan.id,
      productGid: input.productGid ?? plan.productGid,
      productTitle: input.productTitle,
      seatsIncluded: plan.seats,
      seatsUsed: 1,
      periodEnd,
    },
    include: { plan: true },
  });
}

export async function cancelContract(shop: string, licenseKey: string) {
  const contract = await prisma.contract.findUnique({ where: { licenseKey } });
  if (!contract || contract.shop !== shop) return null;
  return prisma.contract.update({
    where: { licenseKey },
    data: { status: "canceled" },
  });
}

export async function listContracts(shop: string) {
  return prisma.contract.findMany({
    where: { shop },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export function ltvMetrics(hardwareCents: number, monthlyCents: number, attachRate: number) {
  const hardwareOnly = hardwareCents;
  const sidecarYear = hardwareCents + monthlyCents * 12;
  return {
    hardwareCents,
    monthlyCents,
    attachRate,
    hardwareOnly,
    sidecarYear,
    lift: sidecarYear - hardwareOnly,
  };
}

export async function mintContractsFromRecentOrders(
  admin: { graphql: (query: string, options?: { variables?: object }) => Promise<Response> },
  shop: string,
) {
  const { plan } = await ensureShopSetup(shop);
  const credential = await prisma.shopCredential.findUnique({ where: { shop } });
  const response = await admin.graphql(
    `#graphql
    query SidecarRecentOrders {
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          name
          email
          lineItems(first: 25) {
            nodes {
              title
              sku
              product { id title }
            }
          }
        }
      }
    }`,
  );
  const json = await response.json();
  const orders = json.data?.orders?.nodes ?? [];
  const camGid = plan.productGid;
  const guardGid = credential?.guardProductGid;
  const minted: string[] = [];

  for (const order of orders) {
    const existing = await prisma.contract.findUnique({
      where: { shopifyOrderId: order.id },
    });
    if (existing) continue;

    const items = order.lineItems?.nodes ?? [];
    const match = items.some((item: { sku?: string; title?: string; product?: { id?: string } }) => {
      const sku = (item.sku || "").toUpperCase();
      const title = (item.title || "").toLowerCase();
      const productId = item.product?.id;
      return (
        sku === "RIBBIT-GUARD" ||
        sku === "SIDECAR-GUARD" ||
        title.includes("guard pro") ||
        productId === guardGid ||
        productId === camGid
      );
    });
    if (!match) continue;
    const hardware = items.find(
      (item: { product?: { id?: string; title?: string } }) => item.product?.id === camGid,
    );
    const contract = await mintContract({
      shop,
      email: order.email || "buyer@lumen.example",
      shopifyOrderId: order.id,
      productGid: camGid || undefined,
      productTitle: hardware?.product?.title || "Lumen Cam + Guard Pro",
    });
    minted.push(`${order.name}: ${contract.licenseKey}`);
  }

  return minted;
}
