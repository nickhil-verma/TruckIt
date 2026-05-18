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
      routes = await RoutePost.find({ status: "active" }).populate('driverId', 'name location truckNumber licenseNumber tripsDone reviewsCount').sort({ createdAt: -1 });
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
    const { origin, destination, date, truckType, price, viaStops } = await req.json();

    const routePost = await RoutePost.create({
      driverId: user.id,
      origin,
      destination,
      date,
      truckType,
      price: price ? Number(price) : 0,
      viaStops: viaStops || [],
      status: "active"
    });

    return NextResponse.json({ routePost }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = verifyToken(req);
    if (!user || user.role !== "driver") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const url = new URL(req.url);
    const postId = url.searchParams.get("id");

    const routePost = await RoutePost.findById(postId);
    if (!routePost) return NextResponse.json({ error: "Route post not found" }, { status: 404 });

    if (routePost.driverId.toString() !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (routePost.status !== "active") return NextResponse.json({ error: "Only active unaccepted route posts can be deleted" }, { status: 400 });

    await RoutePost.findByIdAndDelete(postId);
    return NextResponse.json({ message: "Route post deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
