import { Router } from "express";
const {
  getAllPembayaran,
  getPembayaranById,
  createPembayaran,
  updatePembayaran,
  deletePembayaran,
  prosesPembayaran,
} = require("../controllers/pengguna/pembayaranController");

const router = Router();

router.get("/", getAllPembayaran);
router.get("/:id", getPembayaranById);
router.post("/", createPembayaran);
router.put("/:id", updatePembayaran);
router.delete("/:id", deletePembayaran);
router.post("/transaksi", prosesPembayaran);

module.exports = router;
