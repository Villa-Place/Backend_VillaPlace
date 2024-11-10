import mongoose, { Schema } from "mongoose";
import { IVilla } from "../types/Villa";

const VillaSchema: Schema = new Schema(
  {
    nama: { type: String, required: true },
    deskripsi: { type: String, required: true },
    lokasi: { type: String, required: true },
    kategori: { type: [String], required: true },
    fasilitas: { type: [String], required: true },
    harga: { type: Number, required: true },
    foto_villa: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VillaPhoto",
      },
    ],
    pemilik_villa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    status: { type: String, required: true, default:"pending" },
  },
  { timestamps: true }
);

export const Villa = mongoose.model<IVilla>("Villa", VillaSchema);
