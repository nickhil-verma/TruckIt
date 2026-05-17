import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import Trip from "@/models/Trip";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    
    if (!tripId) return NextResponse.json({ error: "tripId is required" }, { status: 400 });

    await connectToDatabase();
    
    // Verify user is part of the trip
    const trip = await Trip.findById(tripId);
    if (!trip || (trip.userId.toString() !== user.id && trip.driverId?.toString() !== user.id)) {
        return NextResponse.json({ error: "Unauthorized or Trip not found" }, { status: 403 });
    }

    const messages = await Message.find({ tripId }).sort({ createdAt: 1 });
    
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { tripId, text } = await req.json();

    if (!tripId || !text) {
      return NextResponse.json({ error: "tripId and text are required" }, { status: 400 });
    }

    // Verify user is part of the trip
    const trip = await Trip.findById(tripId);
    if (!trip || (trip.userId.toString() !== user.id && trip.driverId?.toString() !== user.id)) {
        return NextResponse.json({ error: "Unauthorized or Trip not found" }, { status: 403 });
    }

    const message = await Message.create({
      tripId,
      senderId: user.id,
      text
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
