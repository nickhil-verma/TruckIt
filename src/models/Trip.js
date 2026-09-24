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
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  paymentMethod: { type: String, default: "razorpay" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
}, { timestamps: true });

TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ driverId: 1, createdAt: -1 });
TripSchema.index({ status: 1 });

export default mongoose.models.Trip || mongoose.model("Trip", TripSchema);
