import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState} from 'preact/hooks';

const APP_ORIGIN = 'https://unified-reduction-vcr-webshots.trycloudflare.com';
const COMPANION_APP_URL = `${APP_ORIGIN}/apps/lumen-guardian-demo/account`;

export default function extension() {
  render(<ThankYou />, document.body);
}

function ThankYou() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const orderId = shopify.orderConfirmation.value?.order?.id;

  function updateEmail(event) {
    const field = /** @type {{value: string}} */ (event.currentTarget);
    setEmail(field.value);
  }

  async function activateAccount() {
    if (!email || !orderId) return;
    setStatus('loading');
    try {
      const token = await shopify.sessionToken.get();
      const response = await fetch(`${APP_ORIGIN}/api/v1/checkout/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, orderId}),
      });
      if (!response.ok) throw new Error('Account activation failed');
      setStatus('active');
    } catch {
      setStatus('error');
    }
  }

  return (
    <s-banner heading="Your Lumen Guardian app is ready" tone="success">
      <s-stack direction="block" gap="base">
        <s-text>
          Connect this Guard Pro order to the email you will use for your
          companion account.
        </s-text>
        {status !== 'active' ? (
          <>
            <s-email-field
              label="Account email"
              value={email}
              onInput={updateEmail}
            />
            <s-button
              variant="primary"
              disabled={!email || !orderId || status === 'loading'}
              onClick={activateAccount}
            >
              {status === 'loading' ? 'Connecting…' : 'Connect my app'}
            </s-button>
          </>
        ) : (
          <s-link href={COMPANION_APP_URL}>Open Lumen Guardian</s-link>
        )}
        {status === 'error' ? (
          <s-text>Could not connect the account. Please try again.</s-text>
        ) : null}
      </s-stack>
    </s-banner>
  );
}
