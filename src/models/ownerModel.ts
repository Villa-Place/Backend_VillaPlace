import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IOwner } from "../types/owner";

const ownerSchema = new Schema<IOwner>(
  {
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    no_telepon: { type: String, required: true },
    foto_profile: { type: String, default: "default.png" },
  },
  { timestamps: true },
);

export default mongoose.model<IOwner>("Owner", ownerSchema);
