import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createOrder } from "@/lib/razorpay";

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { amount, pickup, dropoff, truckType, tripId } = await req.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const receipt = tripId 
      ? `trp_${tripId.slice(-8)}_${Date.now().toString().slice(-4)}`
      : `bk_${Date.now().toString().slice(-8)}`;

    const notes = {
      userId: user.id,
      pickup: pickup || "",
      dropoff: dropoff || "",
      truckType: truckType || "",
      tripId: tripId || "",
    };

    const order = await createOrder({
      amount: numericAmount,
      receipt,
      notes,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    }, { status: 200 });

  } catch (error) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create Razorpay order" 
    }, { status: 500 });
  }
}
