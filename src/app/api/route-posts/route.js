import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import RoutePost from "@/models/RoutePost";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const driverId = url.searchParams.get("driverId");
    
    let routes;
    if (driverId) {
      routes = await RoutePost.find({ driverId }).sort({ createdAt: -1 });
    } else {
      routes = await RoutePost.find({ status: "active" }).populate('driverId', 'name location').sort({ createdAt: -1 });
    }
    
    return NextResponse.json({ routes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user || user.role !== "driver") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { origin, destination, date, truckType } = await req.json();

    const routePost = await RoutePost.create({
      driverId: user.id,
      origin,
      destination,
      date,
      truckType,
      status: "active"
    });

    return NextResponse.json({ routePost }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
