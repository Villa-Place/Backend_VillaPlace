import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Admin } from "../../models/admin";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

//! LOGIN ADMIN
export const loginAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      res.status(400).json({
        status: "Failed",
        message: "Username yang anda masukan salah",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      res.status(400).json({
        status: "Failed",
        message: "Password yang anda masukan salah",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: admin._id,
        nama: admin.nama,
        email: admin.email,
        foto_profile: admin.foto_profile,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.cookie("tokenAdmin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//! LOG OUT ADMIN
export const logoutAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie("tokenAdmin");
    // Menghapus token di klien
    res.json({
      status: "Success",
      message: "Logout berhasil",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during logout" });
  }
};
