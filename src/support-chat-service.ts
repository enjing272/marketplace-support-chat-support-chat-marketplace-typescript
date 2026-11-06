import { createServer } from "node:http";
import { InfraiClient } from "./infrai-client.ts";
import { chatRequest, decideHandoff } from "./support-chat-decision.ts";

const client = new InfraiClient();
const channel = "marketplace-support";

async function readBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  let text = "";
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/support-chat") {
    response.writeHead(404).end();
    return;
  }
  try {
    const input = chatRequest.parse(await readBody(request));
    const handoff = decideHandoff(input);
    await client.createChannel(channel);
    await client.publish(channel, "buyer.update", { order_id: input.orderId, buyer_id: input.buyerId, message: input.message, handoff }, input.sellerId);
    if (input.visitorLeft) await client.sendTranscript(input.sellerEmail, `Order ${input.orderId} support transcript`, input.message);
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ orderId: input.orderId, handoff, transcriptSent: input.visitorLeft }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid support request";
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: message }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("support chat listening"));
