import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance with environment variables
export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not set in environment.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates an order on Razorpay
 * @param {number} amount - in INR (will be converted to paise)
 * @param {string} receipt - receipt identifier
 * @param {object} notes - additional metadata
 */
export async function createOrder({ amount, receipt, notes = {} }) {
  const razorpay = getRazorpayInstance();

  const options = {
    amount: Math.round(Number(amount) * 100), // amount in lowest currency unit (paise)
    currency: "INR",
    receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verifies Razorpay payment signature
 * HMAC SHA256 of (order_id + "|" + payment_id) with secret
 */
export function verifySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

/**
 * Verifies Razorpay webhook signature
 */
export function verifyWebhookSignature({ rawBody, signature, secret }) {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}
