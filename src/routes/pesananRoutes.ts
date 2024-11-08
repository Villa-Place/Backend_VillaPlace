import express from "express";

const {
  verifyUserLogin,
  verifyOwnerLogin,
} = require("../middleware/verifyToken");
const route = express.Router();

const {
  getAllPesanan,
  getPesananById,
  createPesanan,
  updatePesanan,
  deletePesanan,
} = require("../controllers/pengguna/pesananController");

route.get("/", getAllPesanan);
route.post("/", verifyUserLogin, createPesanan);
route.get("/:id", getPesananById);
route.put("/:id", updatePesanan);
route.delete("/:id", deletePesanan);

export default route;
