import mongoose, { Schema, Document } from "mongoose";
import { IAdmin } from "../types/admin";

const adminSchema = new Schema<IAdmin>(
  {
    nama: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    no_telepon: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    foto_profile: { type: String, default: "default.png" },
  },
  { timestamps: true },
);

export const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
