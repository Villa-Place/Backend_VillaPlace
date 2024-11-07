import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Owner from "../models/ownerModel";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

//! Fungsi untuk register owner
export const registerOwner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nama, email, password, no_telepon } = req.body;

    const existingUser = await Owner.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: "Failed",
        message: "Email sudah digunakan!",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const owner = new Owner({
      nama,
      email,
      password: hashedPassword,
      no_telepon,
    });

    await owner.save();
    res.status(201).json({
      status: "Success",
      message: "Owner berhasil dibuat",
      data: owner,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//! MEMBUAT MENU LOGIN, ADMIN OWNER!
export const loginOwner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const owner = await Owner.findOne({ email });
    if (!owner) {
      res.status(400).json({
        status: "Failed",
        message: "Username yang anda masukan salah",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, owner.password);

    if (!isPasswordValid) {
      res.status(400).json({
        status: "Failed",
        message: "Password yang anda masukan salah",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: owner._id,
        nama: owner.nama,
        email: owner.email,
        no_telepon: owner.no_telepon,
        foto_profile: owner.foto_profile,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    // res.cookie("tokenUser", token);
    res.cookie("tokenOwner", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.json({
      status: "Success",
      message: "Berhasil login",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//! LOGOUT OWNER

export const logoutOwner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Menghapus token di klien
    res.clearCookie("tokenOwner");
    res.json({
      status: "Success",
      message: "Logout berhasil",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during logout" });
  }
};
