import { Document, Schema } from "mongoose";

export interface IUlasan extends Document {
  komentar: string;
  rating: number;
  user: Schema.Types.ObjectId;
  villa: Schema.Types.ObjectId;
}
