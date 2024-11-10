import { Schema, Document } from "mongoose";

export interface IVilla extends Document {
  nama: string;
  deskripsi: string;
  lokasi: string;
  kategori: string[];
  fasilitas: string[];
  harga: number;
  status: string;
  foto_villa: Schema.Types.ObjectId[]; // Relasi ke foto-foto villa
  pemilik_villa: Schema.Types.ObjectId; // Relasi ke user sebagai pemilik villa
}
