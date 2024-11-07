import express from "express";
import pesananRoutes from "./pesananRoutes";

const villaRoutes = require("./villaRoutes");
const pembayaranRoutes = require("./pembayaranRoutes");
const exampleRoutes = require("./example/exampleRoutes");
import authRoutes from "./authRoutes";
const favoriteRoutes = require("./favoriteRoutes");
const ulasanRoutes = require("./ulasanRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

// Use exampleRoutes
router.use("/example", exampleRoutes);
router.use("/pesanan", pesananRoutes);
router.use("/villa", villaRoutes);
router.use("/pembayaran", pembayaranRoutes);
router.use("/auth", authRoutes);
router.use("/favorite", favoriteRoutes);
router.use("/ulasan", ulasanRoutes);
router.use("/admin", adminRoutes);

// router.use("/owner", ownerRoutes); // Routes untuk owner
module.exports = router;
