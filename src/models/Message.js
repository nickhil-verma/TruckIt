import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" }
}, { timestamps: true });

MessageSchema.index({ tripId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
