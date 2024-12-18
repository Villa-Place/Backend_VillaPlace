import { Request, Response } from "express";
import { Admin } from "../models/adminModel";
import User from "../models/userModel";
import Owner from "../models/ownerModel";
import { Pesanan } from "../models/pesananModel";
import { Villa } from "../models/villaModel";
import { Pembayaran } from "../models/pembayaranModel";

import bcrypt from "bcrypt";

const adminController = {
  dashboardAdmin: async (req: Request, res: Response) => {
    try {
      // Get counts of owners, users, orders, and villas
      const ownerCount = await Owner.countDocuments();
      const userCount = await User.countDocuments();
      const pesananCount = await Pesanan.countDocuments();
      const villaCount = await Villa.countDocuments();

      const { range } = req.query;

      if (!range || (range !== "1-6" && range !== "7-12")) {
        return res
          .status(400)
          .json({ message: "Invalid range. Use '1-6' or '7-12'." });
      }

      const [startMonth, endMonth] = range === "1-6" ? [1, 6] : [7, 12];

      const pembayaranData = await Pembayaran.aggregate([
        {
          $lookup: {
            from: "pesanans",
            localField: "pesanan",
            foreignField: "_id",
            as: "pesanan",
          },
        },
        { $unwind: "$pesanan" },
        {
          $lookup: {
            from: "villas",
            localField: "pesanan.villa",
            foreignField: "_id",
            as: "pesanan.villa",
          },
        },
        { $unwind: "$pesanan.villa" },
        {
          $match: {
            status_pembayaran: "success",
          },
        },
        {
          $addFields: {
            bulanPembayaran: { $month: "$tanggal_pembayaran" },
          },
        },
        {
          $match: {
            bulanPembayaran: { $gte: startMonth, $lte: endMonth },
          },
        },
        {
          $group: {
            _id: "$bulanPembayaran",
            totalPembayaran: { $sum: "$jumlah_pembayaran" }, // Sum payments
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $addFields: {
            bulan: {
              $arrayElemAt: [
                [
                  "",
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ],
                "$_id",
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            bulan: 1,
            totalPembayaran: 1,
            count: 1,
          },
        },
      ]);

      // Calculate total payments across all months
      const totalKeseluruhan = pembayaranData.reduce(
        (acc, curr) => acc + curr.totalPembayaran,
        0
      );

      // Return combined data for dashboard
      res.status(200).json({
        success: true,
        data: {
          ownerCount,
          userCount,
          pesananCount,
          villaCount,
          pembayaranData,
          totalKeseluruhan,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Something went wrong while fetching dashboard data.",
      });
    }
  },

  getAllAdmins: async (req: Request, res: Response): Promise<void> => {
    try {
      const admins = await Admin.find({}, "-password"); // Exclude password field

      res.json({
        status: "Success",
        message: "Successfully retrieved admins",
        data: admins,
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getAdminById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const admin = await Admin.findById(id, "-password");

      if (!admin) {
        res.status(404).json({
          status: "error",
          message: "Admin not found",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Success get admin by id",
        data: admin,
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  createAdmin: async (req: Request, res: Response) => {
    try {
      const { nama, email, password } = req.body;
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          status: "error",
          message: "Admin with this email already exists",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = new Admin({
        nama,
        email,
        password: hashedPassword,
      });

      const savedAdmin = await newAdmin.save();

      return res.status(201).json({
        status: "success",
        message: "Admin created successfully",
        data: savedAdmin,
      });
    } catch (error: any) {
      console.error("Error creating admin:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal Server Error",
      });
    }
  },

  updateAdminById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { nama, email } = req.body;
      const updateData: any = { nama, email };

      const errors: { [key: string]: string } = {};

      const emailExists = await Admin.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        errors.email = "Email sudah digunakan oleh admin lain";
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          status: "Failed",
          message: "Validasi gagal",
          errors, // Mengirim semua error yang ditemukan dalam objek
        });
        return;
      }

      const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedAdmin) {
        res.status(404).json({
          status: "error",
          message: "Admin not found",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Success update admin by id",
        data: updatedAdmin,
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  deleteAdminById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedAdmin = await Admin.findByIdAndDelete(id);
      if (!deletedAdmin) {
        res.status(404).json({
          status: "error",
          message: "Admin not found",
        });

        return;
      }
      res.status(200).json({
        status: "success",
        message: "Success delete admin by id",
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getAdminCurrent: async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.body.admin.adminId;
      const admin = await Admin.findById(adminId, "-password");
      if (!admin) {
        res.status(404).json({ status: "Failed", message: "Admin not found" });
        return;
      }
      res.json({
        status: "Success",
        data: admin,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  },

  changePasswordAdmin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      // Objek untuk menyimpan error
      const errors: { [key: string]: string } = {};

      // Validasi untuk password lama dan password baru
      if (!currentPassword) {
        errors.currentPassword = "Password lama harus diisi";
      }
      if (!newPassword) {
        errors.newPassword = "Password baru harus diisi";
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          status: "Failed",
          message: "Password harus memiliki minimal 8 karakter",
        });
        return;
      }
      const adminId = req.body.admin.adminId;
      const admin = await Admin.findById(adminId);

      if (!admin) {
        res.status(404).json({ status: "Failed", message: "Owner not found" });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);

      if (!isMatch) {
        errors.currentPassword = "Password lama tidak sesuai!";
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          status: "Failed",
          message: "Validasi gagal",
          errors, // Mengirim semua error yang ditemukan dalam objek
        });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedNewPassword;
      await admin.save();

      res.status(200).json({
        status: "Success",
        message: "Password successfully updated",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = adminController;
