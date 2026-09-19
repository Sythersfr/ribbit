import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

const GUARD_VARIANT_ID = 'gid://shopify/ProductVariant/50354126618658';
const GUARD_PRODUCT_ID = 'gid://shopify/Product/10222137016354';

export default async () => {
  render(<Extension />, document.body);
};

function lineTitle(line) {
  return (
    line?.merchandise?.product?.title ||
    line?.merchandise?.title ||
    ''
  ).toLowerCase();
}

function Extension() {
  const lines = shopify.lines.value;
  const canAdd = shopify.instructions.value.lines.canAddCartLine;
  const hasCam = lines.some((line) => lineTitle(line).includes('lumen cam'));
  const hasGuard = lines.some(
    (line) =>
      line.merchandise.id === GUARD_VARIANT_ID ||
      lineTitle(line).includes('guard pro'),
  );
  const [sellingPlanId, setSellingPlanId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      try {
        const result = await shopify.query(
          `query ($id: ID!) {
            product(id: $id) {
              sellingPlanGroups(first: 5) {
                nodes {
                  sellingPlans(first: 5) {
                    nodes { id name }
                  }
                }
              }
            }
          }`,
          { variables: { id: GUARD_PRODUCT_ID } },
        );
        const plan =
          result?.data?.product?.sellingPlanGroups?.nodes?.[0]?.sellingPlans
            ?.nodes?.[0]?.id;
        if (!cancelled && plan) setSellingPlanId(plan);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasGuard) {
    return (
      <s-banner heading="Ribbit" tone="success">
        <s-text>
          Bundle locked in: Lumen Cam + Guard Pro monthly. Ribbit issues a
          license after payment.
        </s-text>
      </s-banner>
    );
  }

  if (!hasCam) {
    return null;
  }

  async function addGuard() {
    if (!canAdd) return;
    const change = {
      type: 'addCartLine',
      merchandiseId: GUARD_VARIANT_ID,
      quantity: 1,
    };
    if (sellingPlanId) change.sellingPlanId = sellingPlanId;
    const result = await shopify.applyCartLinesChange(change);
    if (result.type === 'error') setError(result.message);
  }

  return (
    <s-banner heading="Ribbit bundle · Guard Pro monthly">
      <s-stack gap="base">
        <s-text>
          This camera is sold with Lumen Guard Pro — $12 every month. Add the
          subscription to complete the bundle.
        </s-text>
        <s-button variant="primary" onClick={addGuard} disabled={!canAdd}>
          Add Guard Pro — $12/month
        </s-button>
        {error ? <s-text>{error}</s-text> : null}
      </s-stack>
    </s-banner>
  );
}
