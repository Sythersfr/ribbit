import '@shopify/ui-extensions/preact';
import {render} from 'preact';

const COMPANION_APP_URL =
  'https://unified-reduction-vcr-webshots.trycloudflare.com/apps/lumen-guardian-demo';

export default function extension() {
  render(<ThankYou />, document.body);
}

function ThankYou() {
  return (
    <s-banner heading="Your Lumen Guardian app is ready" tone="success">
      <s-stack direction="block" gap="base">
        <s-text>
          Guard Pro is connected to your checkout email. Use that email to sign
          in and open your companion dashboard.
        </s-text>
        <s-link href={COMPANION_APP_URL}>Open Lumen Guardian</s-link>
      </s-stack>
    </s-banner>
  );
}
