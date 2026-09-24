import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Trip from "@/models/Trip";
import { verifyToken } from "@/lib/auth";
import { verifySignature } from "@/lib/razorpay";

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      tripData,
    } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required payment parameters." }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json({ 
        error: "Payment verification failed. Invalid signature." 
      }, { status: 400 });
    }

    await connectToDatabase();

    let trip;

    // Check if paying for an existing trip
    if (tripData?.tripId) {
      trip = await Trip.findById(tripData.tripId);
      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      if (trip.userId.toString() !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      trip.paymentStatus = "paid";
      trip.paymentMethod = "razorpay";
      trip.razorpayOrderId = razorpayOrderId;
      trip.razorpayPaymentId = razorpayPaymentId;
      trip.razorpaySignature = razorpaySignature;
      await trip.save();
    } else {
      // Create new trip with paid status
      if (!tripData || !tripData.pickup || !tripData.dropoff || !tripData.price) {
        return NextResponse.json({ error: "Incomplete trip booking data" }, { status: 400 });
      }

      trip = await Trip.create({
        userId: user.id,
        pickup: tripData.pickup,
        dropoff: tripData.dropoff,
        truckType: tripData.truckType,
        price: tripData.price,
        distance: tripData.distance,
        viaStops: tripData.viaStops || [],
        status: "pending",
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and booking confirmed!",
      trip,
    }, { status: 200 });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to verify payment." 
    }, { status: 500 });
  }
}
