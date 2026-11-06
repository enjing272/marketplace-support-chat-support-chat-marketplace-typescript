import { z } from "zod";

export const chatRequest = z.object({
  orderId: z.string().min(1),
  buyerId: z.string().min(1),
  sellerId: z.string().min(1),
  sellerEmail: z.string().email(),
  message: z.string().min(1),
  visitorLeft: z.boolean().default(false)
});
export type ChatRequest = z.infer<typeof chatRequest>;

export function decideHandoff(input: ChatRequest): "seller" | "queue" {
  return input.visitorLeft || input.message.toLowerCase().includes("order") ? "seller" : "queue";
}
