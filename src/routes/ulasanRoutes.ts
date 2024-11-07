import { Router } from "express";
const router = Router();

const {
  getAllUlasan,
  createUlasan,
  getUlasanById,
  updateUlasanById,
  deleteUlasan,
} = require("../controllers/ulasanController");
const {
  verifyUserLogin,
} = require("../middleware/verifyToken");
router.get("/", getAllUlasan);
router.post("/", verifyUserLogin, createUlasan);
router.get("/:id", getUlasanById);
router.put("/:id", verifyUserLogin, updateUlasanById);
router.delete("/:id", verifyUserLogin, deleteUlasan);

module.exports = router;
