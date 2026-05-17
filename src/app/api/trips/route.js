import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Trip from "@/models/Trip";
import { verifyToken } from "@/lib/auth";

// GET all trips for the logged-in user
export async function GET(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    
    let trips;
    if (user.role === "driver") {
        trips = await Trip.find({ driverId: user.id }).populate('userId', 'name').sort({ createdAt: -1 });
    } else {
        trips = await Trip.find({ userId: user.id }).populate('driverId', 'name avatar rating').sort({ createdAt: -1 });
    }
    
    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new trip booking
export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { pickup, dropoff, truckType, price, distance } = await req.json();

    const trip = await Trip.create({
      userId: user.id,
      pickup,
      dropoff,
      truckType,
      price,
      distance,
      status: "pending"
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
