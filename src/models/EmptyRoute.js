import mongoose from "mongoose";

const EmptyRouteSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  truckType: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["active", "booked", "expired"], default: "active" },
}, { timestamps: true });

export default mongoose.models.EmptyRoute || mongoose.model("EmptyRoute", EmptyRouteSchema);
