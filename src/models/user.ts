// ????

import { IUser } from "../types/user";
import mongoose, { Schema, Document } from "mongoose";
const UserSchema: Schema = new Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  no_telepon: { type: String, required: true },
  role: { type: String, enum: ["user", "owner", "admin"], default: "user" }, // Set default ke 'user'
  foto_profile: { type: String, default: "default.png" },
}, { timestamps: true});

export default mongoose.model<IUser>("User", UserSchema);
