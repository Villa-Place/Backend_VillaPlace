import { Request, Response } from "express";
import { Admin } from "../../models/admin";
import bcrypt from "bcrypt";

const adminController = {
  getAllAdmins: async (req: Request, res: Response) => {
    try {
      const admins = await Admin.find();
      return res.status(200).json({
        status: "success",
        message: "Success get all admins",
        data: admins,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  getAdminById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = await Admin.findById(id);

      if (!admin) {
        return res.status(404).json({
          status: "error",
          message: "Admin not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Success get admin by id",
        data: admin,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  createAdmin: async (req: Request, res: Response) => {
    try {
      const { nama, email, no_telepon, password } = req.body;
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
        no_telepon,
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

  updateAdminById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedAdmin) {
        return res.status(404).json({
          status: "error",
          message: "Admin not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Success update admin by id",
        data: updatedAdmin,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  deleteAdminById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deletedAdmin = await Admin.findByIdAndDelete(id);

      if (!deletedAdmin) {
        return res.status(404).json({
          status: "error",
          message: "Admin not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Success delete admin by id",
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = adminController
