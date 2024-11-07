import { Schema, model } from "mongoose";
import { IPembayaran } from "../types/Pembayaran";

const PembayaranSchema = new Schema<IPembayaran>(
  {
    kode_pembayaran: { type: String, required: true, unique: true },
    status_pembayaran: { type: String, required: true },
    tanggal_pembayaran: { type: Date, default: Date.now },
    metode_pembayaran: { type: String, required: true },
    jumlah_pembayaran: { type: Number, required: true },
    nomor_va: { type: String, default: null },
    cara_pembayaran: { type: String, required: true },
    pesanan: { type: Schema.Types.ObjectId, ref: "Pesanan", required: true },
  },
  { timestamps: true },
);

export const Pembayaran = model<IPembayaran>("Pembayaran", PembayaranSchema);
