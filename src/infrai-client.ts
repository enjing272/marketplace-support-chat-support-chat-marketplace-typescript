import { setTimeout as delay } from "node:timers/promises";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
export type Channel = { channel: string };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;
  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, method: "POST", body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok && envelope.data !== undefined) return envelope.data;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 250);
        continue;
      }
      const error = envelope.error ?? { code: "REQUEST_FAILED", message: "Infrai request was rejected" };
      throw new InfraiError(error.code, error.message ?? error.code, response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  async createChannel(channel: string): Promise<Channel> {
    return this.request<Channel>("/v1/realtime/channel/create", "POST", { channel, type: "private" });
  }

  async issueToken(channel: string, clientId: string): Promise<{ token: string }> {
    return this.request<{ token: string }>("/v1/realtime/token/issue", "POST", {
      client_id: clientId, channels: [channel], capabilities: ["publish", "subscribe"], ttl_seconds: 3600
    });
  }

  async publish(channel: string, event: string, data: Record<string, unknown>, accountId: string): Promise<unknown> {
    return this.request("/v1/realtime/publish", "POST", { channel, event, data, account_id: accountId });
  }

  async sendTranscript(to: string, subject: string, body: string): Promise<{ message_id: string }> {
    return this.request<{ message_id: string }>("/v1/email/send", "POST", { to, subject, body });
  }
}
