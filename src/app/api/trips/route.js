import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Trip from "@/models/Trip";
import User from "@/models/User";
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
        trips = await Trip.find({ userId: user.id }).populate('driverId', 'name avatar rating truckNumber licenseNumber tripsDone reviewsCount').sort({ createdAt: -1 });
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
    const { pickup, dropoff, truckType, price, distance, viaStops } = await req.json();

    const trip = await Trip.create({
      userId: user.id,
      pickup,
      dropoff,
      truckType,
      price,
      distance,
      viaStops: viaStops || [],
      status: "pending"
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT to update trip status or submit reviews
export async function PUT(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { tripId, status, customerReview, customerRating, driverReview, driverRating } = await req.json();

    const trip = await Trip.findById(tripId);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Handle standard status updates
    if (status) {
      if (user.role === "driver") {
        trip.driverId = user.id;
      }
      trip.status = status;

      if (status === "completed" && trip.driverId) {
        await User.findByIdAndUpdate(trip.driverId, { $inc: { tripsDone: 1 } });
      }
    }

    // Handle Customer review of Driver
    if (customerRating !== undefined) {
      trip.customerReview = customerReview;
      trip.customerRating = Number(customerRating);

      // Re-calculate and update driver's average rating in User model
      if (trip.driverId) {
        const driverTrips = await Trip.find({ driverId: trip.driverId, customerRating: { $exists: true, $ne: null } });
        const totalRating = driverTrips.reduce((acc, curr) => acc + (curr.customerRating || 0), 0) + Number(customerRating);
        const count = driverTrips.length + 1;
        const avgRating = Number((totalRating / count).toFixed(1));

        await User.findByIdAndUpdate(trip.driverId, { 
          rating: avgRating,
          $inc: { reviewsCount: 1 }
        });
      }
    }

    // Handle Driver review of Customer
    if (driverRating !== undefined) {
      trip.driverReview = driverReview;
      trip.driverRating = Number(driverRating);
    }

    await trip.save();

    // Populate user and driver names so dashboard can display updated rating immediately
    const updatedTrip = await Trip.findById(tripId)
      .populate('userId', 'name rating')
      .populate('driverId', 'name rating avatar truckNumber licenseNumber tripsDone reviewsCount');

    return NextResponse.json({ trip: updatedTrip }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const url = new URL(req.url);
    const tripId = url.searchParams.get("id");

    const trip = await Trip.findById(tripId);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Ensure the trip belongs to the user deleting it (could be customer or driver deleting their request)
    if (trip.userId.toString() !== user.id && (!trip.driverId || trip.driverId.toString() !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (trip.status !== "pending") return NextResponse.json({ error: "Only pending unaccepted trips can be deleted" }, { status: 400 });

    await Trip.findByIdAndDelete(tripId);
    return NextResponse.json({ message: "Trip deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
