import test from "node:test";
import assert from "node:assert/strict";
import { chatRequest, decideHandoff } from "./support-chat-decision.ts";

test("an order question is handed to the seller and a leaving visitor gets a valid payload", () => {
  const input = chatRequest.parse({
    orderId: "ord-42", buyerId: "buyer-7", sellerId: "seller-3", sellerEmail: "seller@example.com",
    message: "Where is my order?", visitorLeft: true
  });
  assert.equal(decideHandoff(input), "seller");
  assert.equal(input.visitorLeft, true);
});
