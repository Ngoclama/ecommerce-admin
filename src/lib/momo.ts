import crypto from "crypto";

/**
 * MoMo Payment Gateway Integration
 * Documentation: https://developers.momo.vn/#cong-thanh-toan-momo
 */

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface MoMoPaymentRequest {
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  ipnUrl: string;
  amount: string;
  orderId: string;
  requestId: string;
  extraData?: string;
  partnerName?: string;
  storeId?: string;
  requestType: string;
  signature: string;
  lang?: string;
}

export interface MoMoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  signature: string;
}

export interface MoMoIPNRequest {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

/**
 * Get MoMo configuration from environment variables
 */
export function getMoMoConfig(orderId?: string): MoMoConfig {
  // Use FRONTEND_STORE_URL for returnUrl (customer-facing), NEXT_PUBLIC_APP_URL for notifyUrl (API)
  const storeUrl = process.env.FRONTEND_STORE_URL || "http://localhost:3001";
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Build return URL - MoMo will redirect here with resultCode in query params
  // We'll handle success/failure in the return handler
  const returnUrl = orderId
    ? `${storeUrl}/payment/momo/return?orderId=${orderId}`
    : `${storeUrl}/payment/momo/return`;

  return {
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    endpoint:
      process.env.MOMO_ENDPOINT ||
      "https://test-payment.momo.vn/v2/gateway/api/create",
    returnUrl: returnUrl,
    notifyUrl: `${apiUrl}/api/momo/ipn`, // IPN callback to admin API
  };
}

/**
 * Generate HMAC SHA256 signature for MoMo request
 * Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
 */
export function generateMoMoSignature(
  accessKey: string,
  amount: string,
  extraData: string,
  ipnUrl: string,
  orderId: string,
  orderInfo: string,
  partnerCode: string,
  redirectUrl: string,
  requestId: string,
  requestType: string,
  secretKey: string
): string {
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return signature;
}

/**
 * Verify MoMo IPN signature
 * Format for IPN: accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
 */
export function verifyMoMoIPNSignature(
  ipnData: MoMoIPNRequest,
  secretKey: string
): boolean {
  const rawHash =
    `accessKey=${process.env.MOMO_ACCESS_KEY}` +
    `&amount=${ipnData.amount}` +
    `&extraData=${ipnData.extraData}` +
    `&message=${ipnData.message}` +
    `&orderId=${ipnData.orderId}` +
    `&orderInfo=${ipnData.orderInfo}` +
    `&orderType=${ipnData.orderType}` +
    `&partnerCode=${ipnData.partnerCode}` +
    `&payType=${ipnData.payType}` +
    `&requestId=${ipnData.requestId}` +
    `&responseTime=${ipnData.responseTime}` +
    `&resultCode=${ipnData.resultCode}` +
    `&transId=${ipnData.transId}`;

  const calculatedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawHash)
    .digest("hex");

  return calculatedSignature === ipnData.signature;
}

/**
 * Create MoMo payment request
 */
export async function createMoMoPayment(
  orderId: string,
  amount: number,
  orderInfo: string
): Promise<MoMoPaymentResponse> {
  const config = getMoMoConfig(orderId);

  // Validate config
  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error(
      "MoMo configuration is missing. Please check environment variables."
    );
  }

  const requestId = orderId; // Use orderId as requestId
  const extraData = ""; // Optional: encode additional data as base64
  // Use "payWithMethod" to allow user to choose payment method (Wallet, ATM card, QR code)
  // Use "captureWallet" if you only want MoMo wallet payment
  const requestType = "payWithMethod"; // Allows ATM card payment on test page

  // Generate signature
  const signature = generateMoMoSignature(
    config.accessKey,
    amount.toString(),
    extraData,
    config.notifyUrl,
    orderId,
    orderInfo,
    config.partnerCode,
    config.returnUrl,
    requestId,
    requestType,
    config.secretKey
  );

  // Prepare request payload
  const requestBody: MoMoPaymentRequest = {
    partnerCode: config.partnerCode,
    partnerName: "E-Commerce Store",
    storeId: "MoMoStore",
    requestId,
    amount: amount.toString(),
    orderId,
    orderInfo,
    redirectUrl: config.returnUrl,
    ipnUrl: config.notifyUrl,
    lang: "vi",
    extraData,
    requestType,
    signature,
  };

  // Send request to MoMo
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`MoMo API request failed: ${response.statusText}`);
  }

  const result: MoMoPaymentResponse = await response.json();

  // Check result code
  if (result.resultCode !== 0) {
    throw new Error(`MoMo payment creation failed: ${result.message}`);
  }

  return result;
}

/**
 * Check if MoMo is configured
 */
export function isMoMoConfigured(): boolean {
  const config = getMoMoConfig();
  return !!(config.partnerCode && config.accessKey && config.secretKey);
}

/**
 * Get MoMo return URL for a specific order
 */
export function getMoMoReturnUrl(orderId: string): string {
  const storeUrl = process.env.FRONTEND_STORE_URL || "http://localhost:3001";
  return `${storeUrl}/payment/success?orderId=${orderId}&method=momo`;
}
