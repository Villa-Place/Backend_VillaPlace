import mongoose, { Schema } from "mongoose";
import { IFavorite } from "../types/Favorite";

const favoriteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    villa: {
      type: Schema.Types.ObjectId,
      ref: "Villa",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
