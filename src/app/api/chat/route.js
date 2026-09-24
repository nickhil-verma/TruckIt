import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import Trip from "@/models/Trip";
import { verifyToken } from "@/lib/auth";

// In-memory cache for trip authorization: key = `${tripId}:${userId}` -> { isAuthorized: boolean, expiry: number }
const tripAuthCache = new Map();
const AUTH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache for trip messages: key = tripId -> { messages: Array, expiry: number }
const messagesCache = new Map();
const MESSAGES_CACHE_TTL_MS = 2500; // 2.5 seconds (prevents slamming Atlas on tight polling intervals)

export async function GET(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    
    if (!tripId) return NextResponse.json({ error: "tripId is required" }, { status: 400 });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return NextResponse.json({ error: "Invalid tripId format" }, { status: 400 });
    }

    const now = Date.now();
    const authKey = `${tripId}:${user.id}`;
    const cachedAuth = tripAuthCache.get(authKey);

    let isAuthorized = false;

    if (cachedAuth && cachedAuth.expiry > now) {
      isAuthorized = cachedAuth.isAuthorized;
    } else {
      await connectToDatabase();
      const trip = await Trip.findById(tripId).select("userId driverId").lean();
      
      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      isAuthorized = trip.userId.toString() === user.id || trip.driverId?.toString() === user.id;
      tripAuthCache.set(authKey, {
        isAuthorized,
        expiry: now + AUTH_CACHE_TTL_MS,
      });
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized to access trip chat" }, { status: 403 });
    }

    // Check message cache
    const cachedMsg = messagesCache.get(tripId);
    if (cachedMsg && cachedMsg.expiry > now) {
      return NextResponse.json({ messages: cachedMsg.messages }, { 
        status: 200,
        headers: { "X-Cache": "HIT" }
      });
    }

    await connectToDatabase();
    const messages = await Message.find({ tripId })
      .select("_id tripId senderId text status createdAt")
      .sort({ createdAt: 1 })
      .lean();

    messagesCache.set(tripId, {
      messages,
      expiry: now + MESSAGES_CACHE_TTL_MS,
    });
    
    return NextResponse.json({ messages }, { 
      status: 200,
      headers: { "X-Cache": "MISS" }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tripId, text } = await req.json();

    if (!tripId || !text?.trim()) {
      return NextResponse.json({ error: "tripId and text are required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return NextResponse.json({ error: "Invalid tripId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check auth
    const authKey = `${tripId}:${user.id}`;
    const cachedAuth = tripAuthCache.get(authKey);
    let isAuthorized = cachedAuth?.isAuthorized;

    if (isAuthorized === undefined || cachedAuth.expiry <= Date.now()) {
      const trip = await Trip.findById(tripId).select("userId driverId").lean();
      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }
      isAuthorized = trip.userId.toString() === user.id || trip.driverId?.toString() === user.id;
      tripAuthCache.set(authKey, {
        isAuthorized,
        expiry: Date.now() + AUTH_CACHE_TTL_MS,
      });
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const message = await Message.create({
      tripId,
      senderId: user.id,
      text: text.trim(),
    });

    // Invalidate messages cache immediately for this trip
    messagesCache.delete(tripId);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
