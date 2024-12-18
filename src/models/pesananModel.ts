import mongoose, { Schema, CallbackError } from "mongoose";
import { IPesanan } from "../types/Pesanan";
import { Pembayaran } from "./pembayaranModel";

const pesananSchema: Schema = new Schema(
  {
    harga: { type: Number, required: true },
    jumlah_orang: { type: Number, required: true },
    catatan: { type: String },
    status: { type: String, default: "pending" },
    tanggal_mulai: { type: Date, required: true },
    tanggal_selesai: { type: Date, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    villa: {
      type: Schema.Types.ObjectId,
      ref: "Villa",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// buat middleware dimana jika pesanan di hapus maka pembayaran juga di hapus
pesananSchema.pre("deleteMany", async function (next) {
  try {
    const filter = this.getFilter(); // Mendapatkan filter untuk operasi delete
    const pesananIds = await this.model.find(filter).select("_id");
    const ids = pesananIds.map((pesanan) => pesanan._id);

    await Pembayaran.deleteMany({ pesanan: { $in: ids } });
    next();
  } catch (error) {
    console.log(error);
    next(error as CallbackError);
  }
});

export const Pesanan = mongoose.model<IPesanan>("Pesanan", pesananSchema);
