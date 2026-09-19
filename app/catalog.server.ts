import { attachPlanToProduct, ensureShopSetup } from "./ribbit.server";
import prisma from "./db.server";

type Admin = { graphql: (query: string, options?: { variables?: object }) => Promise<Response> };

function numericId(gid: string) {
  return gid.split("/").pop() || "";
}

async function gql(admin: Admin, query: string, variables?: object) {
  const response = await admin.graphql(query, variables ? { variables } : undefined);
  return response.json();
}

async function findProductByHandle(admin: Admin, handle: string) {
  const json = await gql(
    admin,
    `#graphql
    query RibbitProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        variants(first: 1) {
          nodes { id }
        }
      }
    }`,
    { handle },
  );
  return json.data?.productByHandle ?? null;
}

async function createProduct(
  admin: Admin,
  input: { title: string; handle: string; description: string; productType: string },
) {
  const json = await gql(
    admin,
    `#graphql
    mutation RibbitProductCreate($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          handle
          variants(first: 1) { nodes { id } }
        }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title: input.title,
        handle: input.handle,
        status: "ACTIVE",
        vendor: "Lumen",
        productType: input.productType,
        descriptionHtml: input.description,
      },
    },
  );
  const errors = json.data?.productCreate?.userErrors;
  if (errors?.length) {
    throw new Error(errors.map((e: { message: string }) => e.message).join(", "));
  }
  return json.data.productCreate.product;
}

async function setVariant(
  admin: Admin,
  productId: string,
  variantId: string,
  price: string,
  requiresShipping: boolean,
) {
  const json = await gql(
    admin,
    `#graphql
    mutation RibbitVariantUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price }
        userErrors { field message }
      }
    }`,
    {
      productId,
      variants: [
        {
          id: variantId,
          price,
          inventoryPolicy: "CONTINUE",
          inventoryItem: { requiresShipping, tracked: false, sku: requiresShipping ? "LUMEN-CAM" : "RIBBIT-GUARD" },
        },
      ],
    },
  );
  const errors = json.data?.productVariantsBulkUpdate?.userErrors;
  if (errors?.length) {
    throw new Error(errors.map((e: { message: string }) => e.message).join(", "));
  }
}

async function publishToOnlineStore(admin: Admin, productId: string) {
  const pubs = await gql(
    admin,
    `#graphql
    query RibbitPublications {
      publications(first: 25) {
        nodes {
          id
          catalog { title }
        }
      }
    }`,
  );
  const nodes = pubs.data?.publications?.nodes ?? [];
  const online = nodes.find((node: { catalog?: { title?: string } }) =>
    /online store/i.test(node.catalog?.title || ""),
  ) || nodes[0];
  if (!online) return;
  await gql(
    admin,
    `#graphql
    mutation RibbitPublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: productId, input: [{ publicationId: online.id }] },
  );
}

async function requireSubscriptionOnly(admin: Admin, productId: string) {
  await gql(
    admin,
    `#graphql
    mutation RibbitRequireSellingPlan($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    { input: { id: productId, requiresSellingPlan: true } },
  );
}

async function ensureMonthlySellingPlan(admin: Admin, productId: string) {
  const existing = await gql(
    admin,
    `#graphql
    query RibbitSellingPlans {
      sellingPlanGroups(first: 20) {
        nodes {
          id
          name
          merchantCode
          sellingPlans(first: 5) {
            nodes { id name }
          }
        }
      }
    }`,
  );
  const groups = existing.data?.sellingPlanGroups?.nodes ?? [];
  const found = groups.find(
    (group: { merchantCode?: string; name?: string }) =>
      group.merchantCode === "ribbit-guard-monthly" ||
      /guard pro monthly/i.test(group.name || ""),
  );
  if (found?.sellingPlans?.nodes?.[0]?.id) {
    await gql(
      admin,
      `#graphql
      mutation RibbitAttachPlan($id: ID!, $productIds: [ID!]!) {
        sellingPlanGroupAddProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }`,
      { id: found.id, productIds: [productId] },
    );
    return found.sellingPlans.nodes[0].id as string;
  }

  const created = await gql(
    admin,
    `#graphql
    mutation RibbitCreateSellingPlan($input: SellingPlanGroupInput!, $resources: SellingPlanGroupResourceInput) {
      sellingPlanGroupCreate(input: $input, resources: $resources) {
        sellingPlanGroup {
          id
          sellingPlans(first: 1) {
            nodes { id name }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      input: {
        name: "Guard Pro monthly",
        merchantCode: "ribbit-guard-monthly",
        options: ["Billing"],
        position: 1,
        sellingPlansToCreate: [
          {
            name: "$12 every month",
            options: "Monthly",
            position: 1,
            category: "SUBSCRIPTION",
            billingPolicy: {
              recurring: { interval: "MONTH", intervalCount: 1 },
            },
            deliveryPolicy: {
              recurring: { interval: "MONTH", intervalCount: 1 },
            },
            pricingPolicies: [
              {
                fixed: {
                  adjustmentType: "PERCENTAGE",
                  adjustmentValue: { percentage: 0.0 },
                },
              },
            ],
          },
        ],
      },
      resources: { productIds: [productId] },
    },
  );

  const errors = created.data?.sellingPlanGroupCreate?.userErrors;
  if (errors?.length) {
    throw new Error(
      `Monthly subscription setup failed: ${errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
  const planId = created.data?.sellingPlanGroupCreate?.sellingPlanGroup?.sellingPlans?.nodes?.[0]?.id;
  if (!planId) {
    throw new Error("Monthly subscription setup failed: no selling plan returned.");
  }
  return planId as string;
}

export async function seedCheckoutCatalog(admin: Admin, shop: string) {
  await ensureShopSetup(shop);

  let cam = await findProductByHandle(admin, "lumen-cam");
  if (!cam) {
    cam = await createProduct(admin, {
      title: "Lumen Cam",
      handle: "lumen-cam",
      productType: "Hardware",
      description:
        "<p>Smart security camera bundled with <strong>Lumen Guard Pro</strong> — $12/month companion app, verified by Ribbit.</p>",
    });
    await setVariant(admin, cam.id, cam.variants.nodes[0].id, "249.00", true);
    await publishToOnlineStore(admin, cam.id);
    cam = await findProductByHandle(admin, "lumen-cam");
  }

  let guard = await findProductByHandle(admin, "lumen-guard-pro");
  if (!guard) {
    guard = await createProduct(admin, {
      title: "Lumen Guard Pro",
      handle: "lumen-guard-pro",
      productType: "Companion app",
      description:
        "<p><strong>Monthly subscription</strong> for the Lumen companion app. Bundled with Lumen Cam at checkout. Ribbit verifies the live contract.</p>",
    });
    await setVariant(admin, guard.id, guard.variants.nodes[0].id, "12.00", false);
    await publishToOnlineStore(admin, guard.id);
    guard = await findProductByHandle(admin, "lumen-guard-pro");
  }

  const camVariant = cam.variants.nodes[0].id;
  const guardVariant = guard.variants.nodes[0].id;
  const sellingPlanGid = await ensureMonthlySellingPlan(admin, guard.id);
  await requireSubscriptionOnly(admin, guard.id);

  await attachPlanToProduct(shop, cam.id);
  await prisma.shopCredential.update({
    where: { shop },
    data: {
      camProductGid: cam.id,
      camVariantNumeric: numericId(camVariant),
      guardProductGid: guard.id,
      guardVariantNumeric: numericId(guardVariant),
      sellingPlanGid,
      sellingPlanNumeric: numericId(sellingPlanGid),
    },
  });

  const checkoutUrl = checkoutUrlFor(
    shop,
    numericId(camVariant),
    numericId(guardVariant),
    numericId(sellingPlanGid),
  );
  return {
    checkoutUrl,
    camUrl: `https://${shop}/products/lumen-cam`,
    guardUrl: `https://${shop}/products/lumen-guard-pro`,
    storeUrl: `https://${shop}`,
    sellingPlanGid,
  };
}

export function checkoutUrlFor(
  shop: string,
  camVariantNumeric?: string | null,
  guardVariantNumeric?: string | null,
  sellingPlanNumeric?: string | null,
) {
  if (!camVariantNumeric || !guardVariantNumeric) return null;
  const guardPart = sellingPlanNumeric
    ? `${guardVariantNumeric}:1:${sellingPlanNumeric}`
    : `${guardVariantNumeric}:1`;
  return `https://${shop}/cart/${camVariantNumeric}:1,${guardPart}`;
}
