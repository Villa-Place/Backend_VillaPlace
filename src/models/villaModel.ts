import mongoose, { Schema, CallbackError } from "mongoose";
import { IVilla } from "../types/Villa";
import { VillaPhoto } from "./villaPhotoModel";
import { Pesanan } from "./pesananModel";

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
    status: { type: String, required: true, default: "pending" },
    ulasan: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ulasan",
      },
    ],
  },
  { timestamps: true }
);

// buat middleware dimana jika villa di hapus maka photo villa dan pesanan juga di hapus
VillaSchema.pre("deleteMany", async function (next) {
  try {
    const filter = this.getFilter(); // Mendapatkan filter untuk operasi delete
    const villaIds = await this.model.find(filter).select("_id");
    const ids = villaIds.map((villa) => villa._id);

    await VillaPhoto.deleteMany({ villa: { $in: ids } });
    await Pesanan.deleteMany({ villa: { $in: ids } });

    next();
  } catch (error) {
    console.log(error);
    next(error as CallbackError);
  }
});

export const Villa = mongoose.model<IVilla>("Villa", VillaSchema);
