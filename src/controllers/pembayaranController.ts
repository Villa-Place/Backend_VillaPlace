import { Request, Response } from "express";
import { Pembayaran } from "../models/pembayaranModel";
import { Pesanan } from "../models/pesananModel";
const midtransClient = require("midtrans-client");
const mongoose = require("mongoose");

const PembayaranController = {
  getAllPembayaran: async (req: Request, res: Response) => {
    try {
      const { searchQuery, page = 1, limit = 5 } = req.query;

      // Konversi page dan limit menjadi angka
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      const query: any = {};

      if (searchQuery) {
        const sanitizedSearchQuery = searchQuery.toString().replace(/\./g, "");

        query.$or = [
          { email_pembayar: { $regex: searchQuery, $options: "i" } },
          { nama_pembayar: { $regex: searchQuery, $options: "i" } },
          { kode_pembayaran: { $regex: searchQuery, $options: "i" } },
          { metode_pembayaran: { $regex: searchQuery, $options: "i" } },
          { bank: { $regex: searchQuery, $options: "i" } },
          { nomor_va: { $regex: searchQuery, $options: "i" } },
          { "pesanan.villa.nama": { $regex: searchQuery, $options: "i" } },
        ];
      }

      const pembayaran = await Pembayaran.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate([
          {
            path: "pesanan",
            populate: [
              {
                path: "villa",
                populate: [
                  {
                    path: "foto_villa",
                    model: "VillaPhoto",
                  },
                ],
              },
            ],
          },
        ]);

      // Hapus pembayaran yang tidak memiliki pesanan sesuai user
      const filteredPembayaran = pembayaran.filter(
        (item) => item.pesanan !== null
      );

      const totalPayments = await Pembayaran.countDocuments(query);
      const totalPages = Math.ceil(totalPayments / limitNumber);

      return res.status(200).json({
        status: "success",
        message: "Success get all pembayaran",
        pagination: {
          totalItems: totalPayments,
          totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
        },
        data: filteredPembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getPembayaranById: async (req: Request, res: Response) => {
    try {
      const pembayaran = await Pembayaran.findById(req.params.id).populate([
        {
          path: "pesanan",
          populate: [
            {
              path: "villa",
              populate: [
                {
                  path: "foto_villa",
                  model: "VillaPhoto",
                },
              ],
            },
          ],
        },
      ]);
      if (!pembayaran) {
        return res.status(404).json({
          status: "error",
          message: "Pembayaran not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Success get pembayaran by id",
        data: pembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getPembayaranByIdOwner: async (req: Request, res: Response) => {
    try {
      const ownerId = req.body.owner.ownerId;

      const { searchQuery, page = 1, limit = 5 } = req.query;

      // Konversi page dan limit menjadi angka
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      const query: any = {};

      if (searchQuery) {
        const sanitizedSearchQuery = searchQuery.toString().replace(/\./g, "");

        query.$or = [
          { email_pembayar: { $regex: searchQuery, $options: "i" } },
          { nama_pembayar: { $regex: searchQuery, $options: "i" } },
          { kode_pembayaran: { $regex: searchQuery, $options: "i" } },
          { metode_pembayaran: { $regex: searchQuery, $options: "i" } },
          { bank: { $regex: searchQuery, $options: "i" } },
          { nomor_va: { $regex: searchQuery, $options: "i" } },
          { "pesanan.villa.nama": { $regex: searchQuery, $options: "i" } },
        ];
      }

      const pembayaran = await Pembayaran.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate({
          path: "pesanan",
          populate: [
            {
              path: "villa",
              match: { pemilik_villa: ownerId },
              populate: [
                {
                  path: "foto_villa",
                  model: "VillaPhoto",
                },
              ],
            },
          ],
        })
        .exec();

      // Hapus pembayaran yang tidak memiliki pesanan sesuai user
      const filteredPembayaran = pembayaran.filter(
        (item) => item.pesanan !== null
      );

      const totalPayments = await Pembayaran.countDocuments(query);
      const totalPages = Math.ceil(totalPayments / limitNumber);

      return res.status(200).json({
        status: "success",
        message: "Success get pembayaran by id user",
        pagination: {
          totalItems: totalPayments,
          totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
        },
        data: filteredPembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getPembayaranByMonth: async (req: Request, res: Response) => {
    try {
      const ownerId = req.body.owner.ownerId;
      const { range } = req.query; // Filter bulan (1-6 atau 7-12)

      if (!range || (range !== "1-6" && range !== "7-12")) {
        return res
          .status(400)
          .json({ message: "Invalid range. Use '1-6' or '7-12'." });
      }

      // Tentukan range bulan
      const [startMonth, endMonth] = range === "1-6" ? [1, 6] : [7, 12];

      // Aggregation untuk menghitung jumlah pembayaran per bulan
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
            "pesanan.villa.pemilik_villa": new mongoose.Types.ObjectId(ownerId), // Filter berdasarkan pemilik villa
          },
        },
        {
          $addFields: {
            bulanPembayaran: { $month: "$tanggal_pembayaran" }, // Tambahkan bulan pembayaran
          },
        },
        {
          $match: {
            bulanPembayaran: { $gte: startMonth, $lte: endMonth }, // Filter berdasarkan bulan
          },
        },
        {
          $group: {
            _id: "$bulanPembayaran", // Kelompokkan berdasarkan bulan pembayaran
            totalPembayaran: { $sum: "$jumlah_pembayaran" }, // Jumlahkan pembayaran
            count: { $sum: 1 }, // Hitung jumlah transaksi
          },
        },
        {
          $sort: { _id: 1 }, // Urutkan berdasarkan bulan
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
            }, // Konversi angka bulan ke nama bulan
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

      // Hitung total keseluruhan pembayaran
      const totalKeseluruhan = pembayaranData.reduce(
        (acc, curr) => acc + curr.totalPembayaran,
        0
      );

      res.status(200).json({
        status: "success",
        data: pembayaranData,
        totalKeseluruhan,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getPembayaranByIdUser: async (req: Request, res: Response) => {
    try {
      const userId = req.body.userLogin.userId;

      // Cari pembayaran berdasarkan pesanan yang dimiliki user tersebut
      const pembayaran = await Pembayaran.find()
        .populate({
          path: "pesanan",
          match: { user: userId }, // Filter pesanan berdasarkan user
          populate: [
            {
              path: "villa",
              populate: [
                {
                  path: "foto_villa",
                  model: "VillaPhoto",
                },
              ],
            },
          ],
        })
        .exec();

      // Hapus pembayaran yang tidak memiliki pesanan sesuai user
      const filteredPembayaran = pembayaran.filter(
        (item) => item.pesanan !== null
      );

      return res.status(200).json({
        status: "success",
        message: "Success get pembayaran by id user",
        data: filteredPembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getMidtransStatus: async (req: Request, res: Response) => {
    try {
      const { order_id } = req.params;
      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
      });
      const status = await snap.transaction.status(order_id);

      res.status(200).json({
        message: `Get status payment by order id ${order_id} successfull`,
        data: status,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  createPembayaran: async (req: Request, res: Response) => {
    try {
      const {
        nama_pembayar,
        email_pembayar,
        kode_pembayaran,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        bank,
        jumlah_pembayaran,
        expiry_time,
        nomor_va,
        pdf_url,
      } = req.body;

      const errors: Record<string, string> = {};

      if (!nama_pembayar) {
        errors.nama_pembayar = "Nama pembayar is required";
      }

      if (!email_pembayar) {
        errors.email_pembayar = "Email pembayar is required";
      }

      if (!kode_pembayaran) {
        errors.kode_pembayaran = "Kode pembayaran is required";
      }

      if (!status_pembayaran) {
        errors.status_pembayaran = "Status pembayaran is required";
      }

      if (!tanggal_pembayaran) {
        errors.tanggal_pembayaran = "Tanggal pembayaran is required";
      }

      if (!metode_pembayaran) {
        errors.metode_pembayaran = "Metode pembayaran is required";
      }

      if (!bank) {
        errors.bank = "Bank is required";
      }

      if (!jumlah_pembayaran) {
        errors.jumlah_pembayaran = "Jumlah pembayaran is required";
      }

      if (!expiry_time) {
        errors.expiry_time = "Expiry time is required";
      }

      if (!req.body.pesanan) {
        errors.pesanan = "Pesanan is required";
      }

      const pesanan = await Pesanan.findById(req.body.pesanan);

      if (!pesanan) {
        errors.pesanan = "Pesanan not found";
      }

      // Cek jika kode pembayaran sudah ada
      const kodePembayaranExist = await Pembayaran.findOne({
        kode_pembayaran,
      });

      if (kodePembayaranExist) {
        errors.kode_pembayaran = "Kode pembayaran already exist";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Bad request",
          errors,
        });
      }

      const newPembayaran = new Pembayaran({
        nama_pembayar,
        email_pembayar,
        kode_pembayaran,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        bank,
        jumlah_pembayaran,
        expiry_time,
        nomor_va,
        pdf_url,
        pesanan: req.body.pesanan,
      });

      const savedPembayaran = await newPembayaran.save();
      return res.status(201).json({
        status: "success",
        message: "Pembayaran created successfully",
        data: savedPembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  updatePembayaran: async (req: Request, res: Response) => {
    try {
      const errors: Record<string, string> = {};

      const {
        nama_pembayar,
        email_pembayar,
        kode_pembayaran,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        bank,
        jumlah_pembayaran,
        expiry_time,
        nomor_va,
        pdf_url,
      } = req.body;

      if (!nama_pembayar) {
        errors.nama_pembayar = "Nama pembayar is required";
      }

      if (!email_pembayar) {
        errors.email_pembayar = "Email pembayar is required";
      }

      if (!kode_pembayaran) {
        errors.kode_pembayaran = "Kode pembayaran is required";
      }

      if (!status_pembayaran) {
        errors.status_pembayaran = "Status pembayaran is required";
      }

      if (!tanggal_pembayaran) {
        errors.tanggal_pembayaran = "Tanggal pembayaran is required";
      }

      if (!metode_pembayaran) {
        errors.metode_pembayaran = "Metode pembayaran is required";
      }

      if (!bank) {
        errors.bank = "Tipe pembayaran is required";
      }

      if (!jumlah_pembayaran) {
        errors.jumlah_pembayaran = "Jumlah pembayaran is required";
      }

      if (!expiry_time) {
        errors.expiry_time = "Expiry time is required";
      }

      if (!req.body.pesanan) {
        errors.pesanan = "Pesanan is required";
      }

      if (req.body.pesanan) {
        const pesanan = await Pesanan.findById(req.body.pesanan);

        if (!pesanan) {
          errors.pesanan = "Pesanan not found";
        }
      }

      // cek apakah kode pembayaran sudah ada
      const kodePembayaranExist = await Pembayaran.findOne({
        kode_pembayaran,
      });

      if (kodePembayaranExist && kodePembayaranExist._id != req.params.id) {
        errors.kode_pembayaran = "Kode pembayaran already exist";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Bad request",
          errors,
        });
      }

      const updatedPembayaran = await Pembayaran.findByIdAndUpdate(
        req.params.id,
        {
          nama_pembayar,
          email_pembayar,
          kode_pembayaran,
          status_pembayaran,
          tanggal_pembayaran,
          metode_pembayaran,
          bank,
          jumlah_pembayaran,
          expiry_time,
          nomor_va,
          pdf_url,
          pesanan: req.body.pesanan,
        },
        {
          new: true,
        }
      );
      if (!updatedPembayaran) {
        return res.status(404).json({
          status: "error",
          message: "Payment not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Payment updated successfully",
        data: updatedPembayaran,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  deletePembayaran: async (req: Request, res: Response) => {
    try {
      const deletedPembayaran = await Pembayaran.findByIdAndDelete(
        req.params.id
      );
      if (!deletedPembayaran) {
        return res.status(404).json({
          status: "error",
          message: "Payment not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Payment deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  prosesPembayaran: async (req: Request, res: Response) => {
    try {
      const errors: Record<string, string> = {};

      const {
        nama_pembayar,
        email_pembayar,
        kode_pembayaran,
        jumlah_pembayaran,
      } = req.body;

      if (!nama_pembayar) {
        errors.nama_pembayar = "Nama pembayar is required";
      }

      if (!email_pembayar) {
        errors.email_pembayar = "Email pembayar is required";
      }

      if (!kode_pembayaran) {
        errors.kode_pembayaran = "Kode pembayaran is required";
      }

      if (!jumlah_pembayaran) {
        errors.jumlah_pembayaran = "Jumlah pembayaran is required";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Bad request",
          errors,
        });
      }

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
      });

      const parameter = {
        transaction_details: {
          order_id: kode_pembayaran,
          gross_amount: jumlah_pembayaran,
        },
        enabled_payments: [
          "credit_card",
          "cimb_clicks",
          "bca_klikbca",
          "bca_klikpay",
          "bri_epay",
          "echannel",
          "permata_va",
          "bca_va",
          "bni_va",
          "bri_va",
          "cimb_va",
          "other_va",
          "gopay",
          "indomaret",
          "danamon_online",
          "akulaku",
          "shopeepay",
          "kredivo",
          "uob_ezpay",
          "other_qris",
        ],
        customer_details: {
          first_name: nama_pembayar,
          email: email_pembayar,
        },
      };

      const transaction = await snap.createTransaction(parameter);
      res.status(201).json({
        status: "success",
        message: "Create payment successfull",
        data: transaction,
        // token: transaction.token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  },
};

module.exports = PembayaranController;
