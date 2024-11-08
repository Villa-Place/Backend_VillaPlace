import mongoose, { Schema } from "mongoose";
import { IUlasan } from "../types/Ulasan";

const ulasanSchema: Schema = new Schema(
  {
    komentar: { type: String, required: true },
    rating: { type: Number, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    villa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villa",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Ulasan = mongoose.model<IUlasan>("Ulasan", ulasanSchema);
