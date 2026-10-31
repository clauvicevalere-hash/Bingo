import crypto from "node:crypto";

export type OrangeMode = "off" | "mock" | "live";

export type OrangeConfig = {
  mode: OrangeMode;
  enabled: boolean;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  merchantKey: string;
  currency: string;
  appUrl: string;
};

const g = globalThis as unknown as { __orangeToken?: { value: string; expires: number } };

export function orangeConfig(): OrangeConfig {
  const mode = (process.env.ORANGE_MODE || "off").toLowerCase() as OrangeMode;
  const clientId = process.env.ORANGE_CLIENT_ID || "";
  const clientSecret = process.env.ORANGE_CLIENT_SECRET || "";
  const merchantKey = process.env.ORANGE_MERCHANT_KEY || "";
  const liveReady = Boolean(clientId && clientSecret && merchantKey);
  const baseUrl = (process.env.ORANGE_BASE_URL || "https://api.orange.com").replace(/\/+$/, "");
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const currency = process.env.ORANGE_CURRENCY || "XOF";

  return {
    mode,
    enabled: mode === "mock" || (mode === "live" && liveReady),
    baseUrl,
    clientId,
    clientSecret,
    merchantKey,
    currency,
    appUrl,
  };
}

async function accessToken(cfg: OrangeConfig): Promise<string> {
  const now = Date.now();
  if (g.__orangeToken && g.__orangeToken.expires > now + 30_000) return g.__orangeToken.value;

  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(`${cfg.baseUrl}/oauth/v3/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Orange OAuth ${res.status}`);
  }
  g.__orangeToken = {
    value: data.access_token,
    expires: now + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

export type PaymentInit = {
  paymentUrl: string;
  payToken: string;
  raw: unknown;
};

export async function createWebPayment(
  cfg: OrangeConfig,
  input: { orderNumber: string; amount: number; returnUrl: string; cancelUrl: string; notifUrl: string; reference?: string }
): Promise<PaymentInit> {
  const token = await accessToken(cfg);
  const res = await fetch(`${cfg.baseUrl}/om-webpayment/v1/webpayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_key: cfg.merchantKey,
      currency: cfg.currency,
      order_id: input.orderNumber,
      amount: input.amount,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      notif_url: input.notifUrl,
      lang: "fr",
      reference: input.reference || "Tresor Empire",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || !data.payment_url) {
    throw new Error(data.message || data.description || `Orange webpayment ${res.status}`);
  }
  return {
    paymentUrl: data.payment_url,
    payToken: data.pay_token || data.payToken || "",
    raw: data,
  };
}

export async function getTransactionStatus(
  cfg: OrangeConfig,
  payToken: string,
  txnid?: string
): Promise<{ ok: boolean; status: string; raw: unknown }> {
  const token = await accessToken(cfg);
  const qs = new URLSearchParams({ pay_token: payToken });
  if (txnid) qs.set("txnid", txnid);
  const res = await fetch(`${cfg.baseUrl}/om-webpayment/v1/transactionstatus?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  const status = String(data.status || data.transaction_status || "").toUpperCase();
  return { ok: res.ok && status === "SUCCESS", status, raw: data };
}

export function mockToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function notifUrl(cfg: OrangeConfig) {
  return `${cfg.appUrl}/api/payments/orange/webhook`;
}
