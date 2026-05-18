import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function PUT(req) {
  try {
    const userPayload = verifyToken(req);
    if (!userPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { name, location, truckNumber, licenseNumber } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Regex check for Driver specific details
    if (userPayload.role === "driver") {
      if (truckNumber) {
        const cleanTruck = truckNumber.replace(/\s+/g, "").toUpperCase();
        const truckRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        if (!truckRegex.test(cleanTruck)) {
          return NextResponse.json({ error: "Invalid Indian Truck Number format (e.g. MH12AB1234)" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Truck Number is required" }, { status: 400 });
      }

      if (licenseNumber) {
        const cleanLicense = licenseNumber.replace(/\s+/g, "").toUpperCase();
        const licenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{11}$/;
        if (!licenseRegex.test(cleanLicense)) {
          return NextResponse.json({ error: "Invalid Driving License format (e.g. MH1220180001234)" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Driving License Number is required" }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userPayload.id,
      { 
        name, 
        location, 
        ...(userPayload.role === "driver" && { truckNumber, licenseNumber }) 
      },
      { new: true }
    );

    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
