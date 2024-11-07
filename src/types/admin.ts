import { Document } from "mongoose";

export interface IAdmin extends Document {
  nama: string;
  email: string;
  password: string;
  no_telepon: string;
  foto_profile: string;
  comparePassword: (password: string) => Promise<boolean>;
}
