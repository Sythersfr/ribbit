import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { attachPlanToProduct, ensureShopSetup, mintContract } from "../ribbit.server";

const PRODUCTS_QUERY = `#graphql
  query RibbitProducts {
    products(first: 25) {
      nodes {
        id
        title
        status
        featuredMedia {
          preview {
            image {
              url
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { plan } = await ensureShopSetup(session.shop);
  const response = await admin.graphql(PRODUCTS_QUERY);
  const json = await response.json();
  return {
    products: json.data?.products?.nodes ?? [],
    plan,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const productGid = String(form.get("productGid") || "");
  const productTitle = String(form.get("productTitle") || "");

  if (intent === "attach") {
    const plan = await attachPlanToProduct(session.shop, productGid);
    return { attached: plan.productGid };
  }

  if (intent === "purchase") {
    const contract = await mintContract({
      shop: session.shop,
      email: "buyer@lumen.example",
      productGid,
      productTitle,
    });
    return { licenseKey: contract.licenseKey, productTitle };
  }

  return { error: "unknown_intent" };
};

export default function ProductsPage() {
  const { products, plan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Attach companion plan">
      <s-section heading={plan.name}>
        <s-paragraph>
          ${plan.priceCents / 100}/{plan.interval} · {plan.seats} seats. Attach
          Guard Pro to a physical product, then simulate a purchase to mint a
          live contract.
        </s-paragraph>
        {actionData && "licenseKey" in actionData && actionData.licenseKey ? (
          <s-banner tone="success">
            Issued {actionData.licenseKey} for {actionData.productTitle}. Verify
            it on Home.
          </s-banner>
        ) : null}
        {actionData && "attached" in actionData && actionData.attached ? (
          <s-banner tone="success">Attached to {actionData.attached}</s-banner>
        ) : null}
      </s-section>

      <s-section heading="Store products">
        <s-stack direction="block" gap="base">
          {products.map((product: { id: string; title: string; status: string }) => (
            <s-box
              key={product.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
            >
              <s-stack direction="block" gap="base">
                <s-heading>{product.title}</s-heading>
                <s-paragraph>
                  {product.status}
                  {plan.productGid === product.id ? " · Guard Pro attached" : ""}
                </s-paragraph>
                <s-stack direction="inline" gap="base">
                  <Form method="post">
                    <input type="hidden" name="intent" value="attach" />
                    <input type="hidden" name="productGid" value={product.id} />
                    <s-button type="submit" {...(busy ? { loading: true } : {})}>
                      Attach Guard Pro
                    </s-button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="intent" value="purchase" />
                    <input type="hidden" name="productGid" value={product.id} />
                    <input
                      type="hidden"
                      name="productTitle"
                      value={product.title}
                    />
                    <s-button
                      type="submit"
                      variant="primary"
                      {...(busy ? { loading: true } : {})}
                    >
                      Simulate purchase
                    </s-button>
                  </Form>
                </s-stack>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
