import { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  user: Schema.Types.ObjectId;
  villa: Schema.Types.ObjectId;
}
