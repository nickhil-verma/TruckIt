import mongoose from "mongoose";

const RoutePostSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  date: { type: String, required: true },
  truckType: { type: String, required: true },
  price: { type: Number, default: 0 },
  viaStops: { type: [String], default: [] },
  status: { type: String, enum: ["active", "booked", "cancelled"], default: "active" },
}, { timestamps: true });

export default mongoose.models.RoutePost || mongoose.model("RoutePost", RoutePostSchema);
