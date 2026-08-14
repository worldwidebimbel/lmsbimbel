/**
 * Duitku Payment Gateway — generic library for creating invoices,
 * verifying callbacks, and checking transaction status.
 *
 * Docs: https://docs.duitku.com/pop/id/
 *
 * Env vars:
 *   DUITKU_MERCHANT_CODE  — merchant code from Duitku
 *   DUITKU_API_KEY        — API key (merchant key) from Duitku
 *   DUITKU_SANDBOX        — "true" for sandbox, "false" for production
 *
 * DB settings (AppSetting):
 *   duitku_merchant_code
 *   duitku_api_key
 *   duitku_sandbox  ("true"/"false")
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────

export interface DuitkuItemDetail {
  name: string;
  price: number;
  quantity: number;
}

export interface DuitkuCustomerDetail {
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  billingAddress?: DuitkuAddress;
  shippingAddress?: DuitkuAddress;
}

export interface DuitkuAddress {
  firstName: string;
  lastName?: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  countryCode: string;
}

export interface CreateInvoiceParams {
  paymentAmount: number;
  merchantOrderId: string;
  productDetails: string;
  customerVaName: string;
  email: string;
  phoneNumber?: string;
  itemDetails?: DuitkuItemDetail[];
  customerDetail?: DuitkuCustomerDetail;
  paymentMethod?: string;
  expiryPeriod?: number; // in minutes
  returnUrl: string;
  callbackUrl: string;
}

export interface CreateInvoiceResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  statusCode: string;
  statusMessage: string;
}

export interface CallbackData {
  merchantCode: string;
  amount: number;
  merchantOrderId: string;
  productDetail: string;
  additionalParam: string;
  paymentCode: string;
  resultCode: string;
  merchantUserId: string;
  reference: string;
  signature: string;
  publisherOrderId: string;
  settlementDate: string;
  issuerCode: string;
  bankAppCode: string;
  bankOrderId: string;
  bankRespCode: string;
  bankRespMsg: string;
  cardName: string;
  cardType: string;
  maskedNumber: string;
  tokenId: string;
  transactionState: string;
  transactionStateStatus: string;
  merchantCustomerId: string;
  expiryDate: string;
  customerName: string;
}

export interface CheckTransactionResponse {
  merchantOrderId: string;
  reference: string;
  amount: string;
  fee: string;
  statusCode: string;
  statusMessage: string;
}

// ─── Config ──────────────────────────────────────────────

let dbConfigCache: { data: Record<string, string>; ts: number } | null = null;
const DB_CACHE_TTL = 60_000;

async function getDbConfig(): Promise<Record<string, string>> {
  if (dbConfigCache && Date.now() - dbConfigCache.ts < DB_CACHE_TTL) {
    return dbConfigCache.data;
  }
  try {
    const rows = await db.appSetting.findMany({
      where: {
        key: {
          in: ["duitku_merchant_code", "duitku_api_key", "duitku_sandbox"],
        },
      },
    });
    const data: Record<string, string> = {};
    for (const r of rows) data[r.key] = r.value;
    dbConfigCache = { data, ts: Date.now() };
    return data;
  } catch {
    return {};
  }
}

export function clearPaymentGatewayCache() {
  dbConfigCache = null;
}

function env(key: string): string {
  return (process.env[key] ?? "").replace(/^["']|["']$/g, "").trim();
}

export async function getDuitkuConfig(): Promise<{
  merchantCode: string;
  apiKey: string;
  sandbox: boolean;
  baseUrl: string;
} | null> {
  const dbCfg = await getDbConfig();
  const merchantCode = dbCfg.duitku_merchant_code || env("DUITKU_MERCHANT_CODE");
  const apiKey = dbCfg.duitku_api_key || env("DUITKU_API_KEY");
  const sandboxStr = dbCfg.duitku_sandbox || env("DUITKU_SANDBOX") || "true";
  const sandbox = sandboxStr !== "false";

  if (!merchantCode || !apiKey) return null;

  const baseUrl = sandbox
    ? "https://api-sandbox.duitku.com/api/merchant"
    : "https://api-prod.duitku.com/api/merchant";

  return { merchantCode, apiKey, sandbox, baseUrl };
}

export async function isDuitkuConfigured(): Promise<boolean> {
  const cfg = await getDuitkuConfig();
  return cfg !== null;
}

// ─── Signature helpers ───────────────────────────────────

function hmacSha256(key: string, data: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

function createInvoiceSignature(merchantCode: string, timestamp: number, apiKey: string): string {
  const stringToSign = `${merchantCode}${timestamp}`;
  return hmacSha256(apiKey, stringToSign);
}

function callbackSignature(merchantCode: string, amount: number, merchantOrderId: string, apiKey: string): string {
  const stringToSign = `${merchantCode}${amount}${merchantOrderId}`;
  return hmacSha256(apiKey, stringToSign);
}

function checkTransactionSignature(merchantCode: string, merchantOrderId: string, apiKey: string): string {
  const stringToSign = `${merchantCode}${merchantOrderId}`;
  return hmacSha256(apiKey, stringToSign);
}

// ─── Create Invoice ──────────────────────────────────────

export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
  const cfg = await getDuitkuConfig();
  if (!cfg) throw new Error("Duitku tidak terkonfigurasi. Set DUITKU_MERCHANT_CODE dan DUITKU_API_KEY.");

  const timestamp = Date.now();
  const signature = createInvoiceSignature(cfg.merchantCode, timestamp, cfg.apiKey);

  const body: Record<string, unknown> = {
    paymentAmount: params.paymentAmount,
    merchantOrderId: params.merchantOrderId,
    productDetails: params.productDetails,
    additionalParam: "",
    merchantUserInfo: "",
    paymentMethod: params.paymentMethod || "",
    customerVaName: params.customerVaName,
    email: params.email,
    phoneNumber: params.phoneNumber || "",
    itemDetails: params.itemDetails || [],
    customerDetail: params.customerDetail,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    expiryPeriod: params.expiryPeriod ?? 1440, // 24 hours default
  };

  const url = `${cfg.baseUrl}/createInvoice`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-duitku-signature": signature,
      "x-duitku-timestamp": String(timestamp),
      "x-duitku-merchantcode": cfg.merchantCode,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as CreateInvoiceResponse & { error?: string; Message?: string };

  if (!res.ok || data.statusCode !== "00") {
    const msg = data.statusMessage || data.error || data.Message || `HTTP ${res.status}`;
    throw new Error(`Duitku createInvoice failed: ${msg}`);
  }

  return data;
}

// ─── Verify Callback ─────────────────────────────────────

export async function verifyCallback(callbackData: CallbackData): Promise<boolean> {
  const cfg = await getDuitkuConfig();
  if (!cfg) return false;

  if (!callbackData.merchantCode || !callbackData.amount || !callbackData.merchantOrderId || !callbackData.signature) {
    return false;
  }

  const expectedSignature = callbackSignature(
    callbackData.merchantCode,
    callbackData.amount,
    callbackData.merchantOrderId,
    cfg.apiKey,
  );

  return callbackData.signature === expectedSignature;
}

// ─── Check Transaction Status ────────────────────────────

export async function checkTransaction(merchantOrderId: string): Promise<CheckTransactionResponse> {
  const cfg = await getDuitkuConfig();
  if (!cfg) throw new Error("Duitku tidak terkonfigurasi.");

  const signature = checkTransactionSignature(cfg.merchantCode, merchantOrderId, cfg.apiKey);
  const body = JSON.stringify({
    merchantCode: cfg.merchantCode,
    merchantOrderId,
    signature,
  });

  const sandbox = cfg.sandbox;
  const url = sandbox
    ? "https://sandbox.duitku.com/webapi/api/merchant/transactionStatus"
    : "https://passport.duitku.com/webapi/api/merchant/transactionStatus";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(body)),
    },
    body,
  });

  const data = await res.json() as CheckTransactionResponse & { Message?: string };

  if (!res.ok) {
    throw new Error(`Duitku checkTransaction failed: ${data.Message ?? `HTTP ${res.status}`}`);
  }

  return data;
}

// ─── Helpers ─────────────────────────────────────────────

export function isCallbackSuccess(resultCode: string): boolean {
  return resultCode === "00";
}

export function getCallbackBaseUrl(): string {
  return env("NEXTAUTH_URL").replace(/\/$/, "") || "http://localhost:3000";
}

export function getCallbackUrl(): string {
  return `${getCallbackBaseUrl()}/api/payments/webhook/duitku`;
}

export function getReturnUrl(type: "invoice" | "event" | "ppdb", id: string): string {
  const base = getCallbackBaseUrl();
  switch (type) {
    case "invoice":
      return `${base}/siswa/tagihan?payment=done&id=${id}`;
    case "event":
      return `${base}/events/${id}?payment=done`;
    case "ppdb":
      return `${base}/ppdb/status?id=${id}&payment=done`;
    default:
      return `${base}/admin`;
  }
}
