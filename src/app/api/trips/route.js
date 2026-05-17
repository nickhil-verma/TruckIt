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
    
    const url = new URL(req.url);
    const fetchPending = url.searchParams.get("pending");

    let trips;
    if (user.role === "driver") {
        if (fetchPending === "true") {
          trips = await Trip.find({ status: "pending" }).populate('userId', 'name').sort({ createdAt: -1 });
        } else {
          trips = await Trip.find({ driverId: user.id }).populate('userId', 'name').sort({ createdAt: -1 });
        }
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
    const { pickup, dropoff, truckType, price, distance, driverId } = await req.json();

    const tripData = {
      userId: user.id,
      pickup,
      dropoff,
      truckType,
      price,
      distance,
      status: "pending"
    };

    if (driverId) {
      tripData.driverId = driverId;
    }

    const trip = await Trip.create(tripData);

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT to update trip status
export async function PUT(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { tripId, status } = await req.json();

    const trip = await Trip.findById(tripId);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    if (user.role === "driver") {
      trip.driverId = user.id;
    }
    trip.status = status;
    await trip.save();

    return NextResponse.json({ trip }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
