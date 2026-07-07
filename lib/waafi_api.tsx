import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// WaafiPay endpoints
const WAAFI_ENV = process.env.WAAFI_ENV === "production" ? "production" : "sandbox";
const WAAFI_BASE_URL =  "https://api.waafipay.net/asm"
  

/** Custom error class for WaafiPay failures */
export class WaafiPayError extends Error {
  responseCode: string;
  errorCode?: string;
  state?: string;
  constructor(message: string, responseCode: string, errorCode?: string, state?: string) {
    super(message);
    this.name = "WaafiPayError";
    this.responseCode = responseCode;
    this.errorCode = errorCode;
    this.state = state;
  }
}

// Formats a Date as "YYYY-MM-DD HH:mm:ss.SSS" – required by WaafiPay.
const formatTimestamp = (date: Date): string => {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    pad(date.getMilliseconds(), 3)
  );
};

type WaafiResponse = {
  schemaVersion: string;
  timestamp: string;
  responseId: string;
  responseCode: string; // e.g. "2001"
  errorCode: string;
  responseMsg: string;
  params?: {
    accountNo?: string;
    accountType?: string;
    state?: string; // "APPROVED" | "DECLINED" | "FAILED"
    referenceId?: string;
    transactionId?: string;
    issuerTransactionId?: string;
    txAmount?: string;
    [key: string]: unknown;
  };
};

export type WaafiPurchaseParams = {
  accountNo: string;
  amount: number;
  currency: string;
  referenceId: string;
  description?: string;
};

/**
 * Charges a customer's mobile wallet directly via WaafiPay (API_PURPRISE).
 */
export const waafiPurchase = async ({
  accountNo,
  amount,
  currency,
  referenceId,
  description = "Payment",
}: WaafiPurchaseParams): Promise<WaafiResponse> => {
  // ---- Basic input validation ----
  if (!/^[1-9]\d{9,19}$/.test(String(accountNo))) {
    throw new WaafiPayError(
      "accountNo must be in full international format (digits only, no \"+\" or leading zero)",
      "4000",
      "INVALID_ACCOUNT"
    );
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount)) || Number(amount) <= 0) {
    throw new WaafiPayError("Invalid amount", "4000", "INVALID_AMOUNT");
  }
  if (!/^[A-Z]{3}$/.test(String(currency))) {
    throw new WaafiPayError("Invalid currency code", "4000", "INVALID_CURRENCY");
  }
  if (!/^[A-Za-z0-9\-_.]{1,50}$/.test(String(referenceId))) {
    throw new WaafiPayError("Invalid referenceId format", "4000", "INVALID_REFERENCEID");
  }

  const res = await sendRequestWaafi({
    schemaVersion: "1.0",
    requestId: randomUUID(),
    timestamp: formatTimestamp(new Date()),
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: process.env.WAAFI_MERCHANT_UID,
      apiUserId: process.env.WAAFI_API_USER_ID,
      apiKey: process.env.WAAFI_API_KEY,
      paymentMethod: "MWALLET_ACCOUNT",
      payerInfo: { accountNo: String(accountNo) },
      transactionInfo: {
        referenceId,
        invoiceId: referenceId,
        amount: amount.toFixed(2),
        currency,
        description,
      },
    },
  });

  // WaafiPay returns responseCode "2001" when the request reaches the system successfully.
  if (res.responseCode !== "2001") {
    throw new WaafiPayError(
      res.responseMsg || "WaafiPay request failed",
      res.responseCode,
      res.errorCode,
      res.params?.state
    );
  }

  return res;
};

/**
 * Reverses (refunds) a previous charge via WaafiPay (API_REVERSAL).
 */
export const waafiRefund = async (
  transactionId: string,
  description: string = "Refund"
): Promise<WaafiResponse> => {
  if (!transactionId) {
    throw new WaafiPayError("Original transactionId is required for refund", "4000", "INVALID_TRANSACTION_ID");
  }

  const res = await sendRequestWaafi({
    schemaVersion: "1.0",
    requestId: randomUUID(),
    timestamp: formatTimestamp(new Date()),
    channelName: "WEB",
    serviceName: "API_REVERSAL",
    serviceParams: {
      merchantUid: process.env.WAAFI_MERCHANT_UID,
      apiUserId: process.env.WAAFI_API_USER_ID,
      apiKey: process.env.WAAFI_API_KEY,
      transactionId,
      description,
    },
  });

  return res;
};

/** Backward‑compatible alias */
export const createPaymentLink = waafiPurchase;

/** Low‑level request helper */
const sendRequestWaafi = async (body: Record<string, unknown>): Promise<WaafiResponse> => {
  const res = await fetch(WAAFI_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: WaafiResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WaafiPayError(`Invalid JSON response: ${text}`, `${res.status}`);
  }

  if (!res.ok) {
    const msg = data?.responseMsg || text;
    throw new WaafiPayError(`WaafiPay HTTP ${res.status}: ${msg}`, `${res.status}`);
  }

  return data;
};