import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Trip from "@/models/Trip";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature({
      rawBody,
      signature,
      secret: process.env.RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("Razorpay webhook event received:", event.event);

    await connectToDatabase();

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const trip = await Trip.findOne({ razorpayOrderId: orderId });
        if (trip) {
          trip.paymentStatus = "paid";
          if (paymentId) trip.razorpayPaymentId = paymentId;
          await trip.save();
          console.log(`Trip ${trip._id} marked as paid via webhook.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
