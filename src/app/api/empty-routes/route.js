import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import EmptyRoute from "@/models/EmptyRoute";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Fetch all active empty routes and populate driver info
    const routes = await EmptyRoute.find({ status: "active" })
      .populate('driverId', 'name location')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ routes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { origin, destination, truckType, date } = await req.json();

    const emptyRoute = await EmptyRoute.create({
      driverId: user.id,
      origin,
      destination,
      truckType,
      date,
      status: "active"
    });

    return NextResponse.json({ emptyRoute }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
