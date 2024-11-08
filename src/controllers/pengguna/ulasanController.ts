import { Request, Response } from "express";
import { Ulasan } from "../../models/Ulasan";
import { Villa } from "../../models/villaModel";

const UlasanController = {
  getAllUlasan: async (req: Request, res: Response) => {
    try {
      const ulasanList = await Ulasan.find();
      return res.status(200).json({
        status: "success",
        message: "Success get all ulasan",
        data: ulasanList,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  createUlasan: async (req: Request, res: Response) => {
    try {
      const { villa, komentar, rating, user } = req.body;

      if (!villa) {
        return res.status(400).json({
          status: "error",
          message: "Villa ID is required.",
        });
      }
  
      const newUlasan = new Ulasan({
        komentar,
        rating,
        user,
        villa,
      });
  
      await newUlasan.save();
  
      await Villa.findByIdAndUpdate(villa, {
        $push: { ulasan: newUlasan._id },
      });
      return res.status(201).json({
        status: "success",
        message: "Success add new ulasan",
        data: newUlasan,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  getUlasanById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ulasan = await Ulasan.findById(id)
        .populate("villa")
        .populate("user");
      if (!ulasan) {
        return res.status(404).json({
          status: "error",
          message: "Ulasan not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Success get ulasan by id",
        data: ulasan,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  updateUlasanById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { komentar, rating } = req.body;
      const updatedUlasan = await Ulasan.findByIdAndUpdate(
        id,
        { komentar, rating },
        { new: true, runValidators: true },
      );
      if (!updatedUlasan) {
        return res.status(404).json({
          status: "error",
          message: "Ulasan not found",
        });
      }
    
      return res.status(200).json({
        status: "success",
        message: "Success update ulasan by id",
        data: updatedUlasan,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  },

  deleteUlasan: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedUlasan = await Ulasan.findByIdAndDelete(id);
      if (!deletedUlasan) {
        return res.status(404).json({
          status: "error",
          message: "Ulasan not found",
        });
      }
      await Villa.findByIdAndUpdate(deletedUlasan.villa, {
        $pull: { ulasan: deletedUlasan._id },
      });
      return res.status(200).json({
        status: "success",
        message: "Success delete ulasan by id",
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = UlasanController;
