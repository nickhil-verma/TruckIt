import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "driver"], default: "user" },
  location: { type: String },
  // Driver specific fields
  avatar: { type: String },
  rating: { type: Number, default: 5.0 },
  experience: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
