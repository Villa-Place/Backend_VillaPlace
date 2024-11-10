import { Request, Response } from "express";
import { Villa } from "../models/villaModel";
import { VillaPhoto } from "../models/villaPhotoModel";
import { Ulasan } from "../models/Ulasan";

import fs from "fs";
import path from "path";

const VillaController = {
  getAllVillas: async (req: Request, res: Response) => {
    try {
      const { kategori, lokasi, harga_min, harga_max } = req.query;
  
      let query: any = {};
  
      if (kategori) {
        query.kategori = kategori;
      }
  
      if (lokasi) {
        query.lokasi = lokasi;
      }
  
      if (harga_min) {
        query.harga = { ...query.harga, $gte: Number(harga_min) };
      }
  
      if (harga_max) {
        query.harga = { ...query.harga, $lte: Number(harga_max) };
      }
  
      const villas = await Villa.find(query)
        .populate("pemilik_villa")
        .populate("foto_villa")
        .exec();
  
      const villasWithReviews = await Promise.all(
        villas.map(async (villa) => {
          const ulasans = await Ulasan.find({ villa: villa._id })
            .populate("user", "nama email foto_profile")
            .exec();
  
          return {
            ...villa.toObject(),
            ulasan: ulasans.map((ulasan) => ({
              komentar: ulasan.komentar,
              rating: ulasan.rating,
              user: ulasan.user,
              _id: ulasan._id,
            })),
          };
        })
      );
      return res.status(200).json({
        status: "success",
        message: "Successfully fetched all villas with reviews",
        data: villasWithReviews,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getVillaById: async (req: Request, res: Response) => {
    try {
      const villa = await Villa.findById(req.params.id).populate([
        "pemilik_villa","foto_villa"
      ]);

      if (!villa) {
        return res.status(404).json({
          status: "error",
          message: "Villa not found",
        });
      }
      const ulasans = await Ulasan.find({ villa: req.params.id })
      .populate("user")
      .exec();
      const totalRating = ulasans.reduce((sum, ulasan) => sum + ulasan.rating, 0);
      const averageRating = ulasans.length > 0 ? totalRating / ulasans.length : 0;
      const commentCount = ulasans.length;
    return res.status(200).json({
      status: "success",
      message: "Success get villa by id",
      data: {
        ...villa.toObject(),
        averageRating: averageRating,
        commentCount: commentCount, 
        ulasan: ulasans.map((ulasan) => ({
          komentar: ulasan.komentar,
          rating: ulasan.rating,
          user: ulasan.user,
          _id: ulasan._id,
        })),
      },
    });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  createVilla: async (req: Request, res: Response) => {
    try {
      const newVilla = new Villa(req.body);
      const savedVilla = await newVilla.save();
      return res.status(201).json({
        status: "success",
        message: "Villa created successfully",
        data: savedVilla,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  updateVilla: async (req: Request, res: Response) => {
    try {
      const updatedVilla = await Villa.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );
      if (!updatedVilla) {
        return res.status(404).json({
          status: "error",
          message: "Villa not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Villa updated successfully",
        data: updatedVilla,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  deleteVilla: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedVilla = await Villa.findByIdAndDelete(id);
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
  uploadVillaImages: async (req: Request, res: Response) => {
    try {
      const villaId = req.params.id;
      const imageFiles = req.files as Express.Multer.File[];

      if (!imageFiles || imageFiles.length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      // Buat array objek foto dengan URL dan nama file
      const photos = await Promise.all(
        imageFiles.map(async (file) => {
          const photo = await VillaPhoto.create({
            url: `${req.protocol}://${req.get("host")}/images/villa/${
              file.filename
            }`,
            name: file.filename,
            villa: villaId,
            filepath: file.path,
          });
          return photo._id; // Mengembalikan ID foto yang baru dibuat
        }),
      );

      const villa = await Villa.findByIdAndUpdate(
        villaId,
        { $push: { foto_villa: { $each: photos } } },
        { new: true },
      );

      if (!villa) {
        return res.status(404).json({ message: "Villa not found" });
      }

      res.status(201).json({
        status: "success",
        message: "Villa images uploaded successfully",
        data: villa,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: "Failed to upload villa images",
      });
    }
  },
  getVillaImages: async (req: Request, res: Response) => {
    try {
      const villaId = req.params.id;
      const villa = await Villa.findById(villaId).populate("foto_villa");

      if (!villa) {
        return res
          .status(404)
          .json({ status: "error", message: "Villa not found" });
      }

      return res.status(200).json({
        status: "success",
        message: "Get all photo villa by id villa",
        photos: villa.foto_villa,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: "Failed to get villa photos",
      });
    }
  },

  deleteVillaImage: async (req: Request, res: Response) => {
    try {
      const villaId = req.params.id;
      const photoId = req.params.photoId;

      // Temukan villa dan pastikan foto ada di dalamnya
      const villa = await Villa.findById(villaId);
      if (!villa) {
        return res.status(404).json({ message: "Villa not found" });
      }

      // Periksa apakah photoId ada di dalam array photos
      const isPhotoExist = villa.foto_villa.some(
        (photo) => photo.toString() === photoId,
      );

      if (!isPhotoExist) {
        return res
          .status(404)
          .json({ status: "error", message: "Photo not found" });
      }
      // cari foto_villa berdasarkan photoId
      const villaPhoto = await VillaPhoto.findById(photoId);
      if (!villaPhoto) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Hapus file dari sistem file
      const filePath = path.join(__dirname, "..", "..", villaPhoto.filepath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
          return res.status(500).json({ message: "Failed to delete file" });
        }
      });

      // Hapus foto dari collection Photo
      await VillaPhoto.findByIdAndDelete(photoId);

      // Hapus ID foto dari array photos di dokumen villa
      villa.foto_villa = villa.foto_villa.filter(
        (image) => image.toString() !== photoId,
      );
      await villa.save();

      res.status(200).json({
        status: "success",
        message: "Photo deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete villa photo",
      });
    }
  },
};

module.exports = VillaController;
