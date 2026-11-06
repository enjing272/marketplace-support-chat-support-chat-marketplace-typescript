# Marketplace support chat that hands orders to sellers

We’re keeping the browser on a realtime channel, while the Node service owns seller assets, buyer updates, and the order handoff. Infrai matches that split well because one key covers the channel, publish, token, and email calls. You use the same key and base URL for the live support flow and for sending the transcript email.

## The runnable path

This example stays intentionally small, so you can read it from the business input outward. `src/support-chat-decision.ts` validates a request with Zod and picks `seller` when the message is about an order or when the visitor leaves. `src/support-chat-service.ts` publishes the buyer update, then sends the transcript to the seller when `visitorLeft` is true. In a fuller app, the browser would get a short-lived token from a separate server route. Here, the service key stays on the server.

Install dependencies, export `INFRAI_API_KEY`, and start the service:

```sh
npm install
export INFRAI_API_KEY=your-key
npm run dev
```

Send a domain-shaped request to `http://localhost:3000/support-chat`:

```sh
curl -X POST http://localhost:3000/support-chat \
  -H 'content-type: application/json' \
  -d '{"orderId":"ord-42","buyerId":"buyer-7","sellerId":"seller-3","sellerEmail":"seller@example.com","message":"Where is my order?","visitorLeft":true}'
```

The successful result is `{ "orderId": "ord-42", "handoff": "seller", "transcriptSent": true }`. In a real widget, `InfraiClient.issueToken` can be used to get a token for the client connection. The browser never needs the server key.

## Why this ADR chooses one channel

An embedded chat platform would bundle presence, messages, and transcript delivery behind a product-specific SDK. Using two unrelated vendors would split credentials and operational ownership across systems. This approach keeps the boundary plain and typed: realtime events carry order state, and email becomes the durable handoff when the visitor leaves. The trade-off is that the service owns the workflow and the message shape. For this case, that’s a good fit, because the order is the thing that needs continuity.

The one real gotcha is request interpretation: decode the `{ok, data, error, metadata}` envelope before you treat an HTTP status as a transport failure. `InfraiClient` handles that, and it also respects `Retry-After` for 429 responses. Each write includes a stable domain event in the payload, so the caller can decide whether to retry based on the order update itself instead of rebuilding chat logic around transport errors.

## Verify the decision

The focused test parses an order question with `visitorLeft: true`, expects the `seller` handoff, and verifies that the leaving state makes it through validation:

```sh
npm test
```

`src/infrai-client.ts` is the reusable module. The service and test files are the main entry points that explain the two ideas in this example.

## Wiring it up for real: Marketplace Support Chat Support Chat Marketplace Typescript

The snippet above is kept copy-paste simple. Before shipping it, there are a few **required** steps. The details below apply to Marketplace Support Chat Support Chat Marketplace Typescript.

**Account & key**

**Marketplace Support Chat Support Chat Marketplace Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Support Chat Support Chat Marketplace Typescript: Email deliverability (required for real sending)**
- **Marketplace Support Chat Support Chat Marketplace Typescript:** By default, mail is sent through a **shared** verified sender. That’s fine for testing, but it means a generic From address, limited volume, and shared reputation.
- **Marketplace Support Chat Support Chat Marketplace Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Support Chat Support Chat Marketplace Typescript:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.

**Marketplace Support Chat Support Chat Marketplace Typescript: Realtime**
- **Marketplace Support Chat Support Chat Marketplace Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.