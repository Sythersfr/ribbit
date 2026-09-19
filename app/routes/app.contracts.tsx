import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { cancelContract, ensureShopSetup, listContracts } from "../sidecar.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  await ensureShopSetup(session.shop);
  const contracts = await listContracts(session.shop);
  return { contracts };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const licenseKey = String(form.get("licenseKey") || "");
  const updated = await cancelContract(session.shop, licenseKey);
  return { canceled: updated?.licenseKey };
};

export default function ContractsPage() {
  const { contracts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Live contracts">
      <s-section heading="Customer licenses">
        <s-paragraph>
          Cancel a contract and the next verify call returns valid: false.
        </s-paragraph>
        {actionData?.canceled ? (
          <s-banner tone="warning">Canceled {actionData.canceled}</s-banner>
        ) : null}
        <s-stack direction="block" gap="base">
          {contracts.map((contract) => (
            <s-box
              key={contract.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
            >
              <s-heading>{contract.licenseKey}</s-heading>
              <s-paragraph>
                {contract.status} · {contract.email} · {contract.productTitle || "—"}{" "}
                · {contract.plan.name}
              </s-paragraph>
              {contract.status === "active" ? (
                <Form method="post">
                  <input
                    type="hidden"
                    name="licenseKey"
                    value={contract.licenseKey}
                  />
                  <s-button type="submit" tone="critical">
                    Cancel
                  </s-button>
                </Form>
              ) : null}
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
