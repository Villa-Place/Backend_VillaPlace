import { Request, Response } from "express";
import { Favorite } from "../../models/Favorite";

const favoriteController = {
  getAllFavorite: async (req: Request, res: Response) => {
    try {
      const pesanan = await Favorite.find().populate({
        path: "villa",
        populate: [
          {
            path: "kategori",
          },
        ],
      });
      return res.status(200).json({
        status: "success",
        message: "Success get all pesanan",
        data: pesanan,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  createFavorite: async (req: Request, res: Response) => {
    try {
      const { user, villa } = req.body;
      const existingFavorite = await Favorite.findOne({
        user,
        villa,
      });

      if (existingFavorite) {
        return res.status(400).json({
          status: "error",
          message: "This villa is already saved as a favorite by this user.",
        });
      }

      const newFavorite = new Favorite(req.body);
      const savedFavorite = await newFavorite.save();

      return res.status(201).json({
        status: "success",
        message: "Villa created successfully",
        data: savedFavorite,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  deleteFavorite: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedVilla = await Favorite.findByIdAndDelete(id);
      console.log(deletedVilla, "deletedVilla");
      if (!deletedVilla) {
        return res.status(404).json({
          status: "error",
          message: "Villa not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Villa deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
};
module.exports = favoriteController;
