import mongoose from "mongoose";

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  truckType: { type: String, required: true },
  price: { type: Number, required: true },
  distance: { type: Number },
  viaStops: { type: [String], default: [] },
  status: { type: String, enum: ["pending", "accepted", "running", "completed", "cancelled"], default: "pending" },
  customerReview: { type: String },
  customerRating: { type: Number },
  driverReview: { type: String },
  driverRating: { type: Number },
}, { timestamps: true });

export default mongoose.models.Trip || mongoose.model("Trip", TripSchema);
