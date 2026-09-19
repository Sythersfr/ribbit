# Ribbit submission kit

## Form answers

**Project title:** Ribbit — Companion apps and recurring revenue for Shopify products

**Repository:** https://github.com/Sythersfr/ribbit

**Deployed demo:** https://sidecar-lumen.myshopify.com
Store password: provide privately in the Airtable submission

**Team:** Nic — Product, design, and full-stack engineering — https://github.com/Sythersfr

## Short write-up

Physical-product merchants increasingly ship connected hardware, but turning
that purchase into recurring software revenue usually requires separate billing
systems, entitlement infrastructure, and a custom customer app. Small teams
often cannot justify that integration work, so valuable companion experiences
never launch.

Ribbit is an app platform for Shopify merchants who want to bundle software with
hardware. In our demo, a shopper buys Lumen Cam together with Guard Pro, a
monthly subscription for intelligent alerts and cloud history. A checkout
extension connects the completed Shopify order to a customer email, while
Ribbit creates an idempotent contract that controls access. The customer then
opens a generated companion web app, signs in with the checkout email, and sees
an account page populated with the connected order, active plan, billing
period, seats, and included features.

For merchants, Ribbit also includes a prompt-based builder that produces a
branded web-app shell without deploying arbitrary generated code. This
demonstrates a reusable path from one-time commerce to recurring customer value:
sell the product, activate software automatically, and give every buyer a
purpose-built account experience. With production hosting, stronger
authentication, and approved lifecycle webhooks, Ribbit could become the
done-for-you subscription and companion-app layer for connected-product brands.

## Loom recording checklist

Before recording:

1. Start `npm run dev` and leave the terminal visible in a second window.
2. Open the Ribbit Shopify Admin page, storefront product, checkout, generated
   app, and App builder in separate tabs.
3. Use a fresh checkout email or `demo@lumen.example` for the fallback path.
4. Confirm screen sharing and camera are enabled.
5. Keep the final recording between 2 and 5 minutes.

## 3–4 minute narration script

### 0:00–0:20 — Team

> Hi, I'm Nic. I handled product design and full-stack engineering for Ribbit,
> including the Shopify catalog, subscription checkout extensions, contract
> backend, and generated customer apps.

### 0:20–0:45 — Elevator pitch

> Hardware brands want recurring software revenue, but building billing,
> entitlements, and a customer app is expensive. Ribbit lets a Shopify merchant
> bundle a monthly companion app with a physical product, activate it from the
> completed checkout, and generate a branded web experience from a prompt.

### 0:45–1:40 — Commerce loop

1. Show the Lumen Cam product and the Guard Pro monthly bundle.
2. Add it to cart and point out `$249` hardware plus `$12/month`.
3. Show checkout and explain that this uses a real Shopify selling plan.
4. Complete or show the completed test order.
5. On the Thank You page, connect the account email and open Lumen Guardian.

Narration:

> The order ID comes from Shopify's authenticated Thank You extension. Ribbit
> uses it as an idempotency key, so the same checkout cannot create duplicate
> contracts.

### 1:40–2:25 — Customer app and proof

1. Sign into Lumen Guardian with the checkout email.
2. Show the unlocked dashboard.
3. Select **Account**.
4. Highlight the email, Shopify order reference, plan price and interval,
   product, period end, seats, and included features.

Narration:

> This account page is part of every generated app template. These fields come
> from the contract created by the checkout—not from hard-coded dashboard copy.

### 2:25–3:05 — Merchant builder

1. Open Ribbit's **App builder**.
2. Show the prompt and optional OpenAI key field.
3. Generate or open another app.
4. Point out that each result receives the same safe account route.

Narration:

> We use React Router, Prisma, Shopify Admin GraphQL, checkout and theme
> extensions, and structured AI output. The model generates a validated app
> specification rather than arbitrary executable code.

### 3:05–3:35 — Engineering challenge and close

> Shopify protects customer order data, so instead of faking an Orders API poll,
> we moved activation into the authenticated Thank You extension. That gives
> Ribbit a trustworthy order ID without requiring protected-data approval.
>
> Ribbit helps connected-product brands move from one-time hardware revenue to a
> durable software relationship. Next, we'd add magic-link authentication,
> permanent hosting, lifecycle webhooks, and more generated app templates.

## Final checklist

- [x] Project title
- [ ] Loom URL — paste into Airtable after recording
- [x] Public repository with complete README
- [x] Quick start, architecture, environment, provenance, limitations
- [x] Working storefront URL
- [x] Team roster
- [x] 150–300 word write-up
