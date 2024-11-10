import { Router } from "express";
import upload from "../config/multerConfig";

const { verifyAdmin, verifyOwner } = require("../middleware/verifyToken");

const router = Router();
const {
  getAllVillas,
  getVillaById,
  createVilla,
  updateVilla,
  deleteVilla,
  uploadVillaImages,
  getVillaImages,
  deleteVillaImage,
  updateVillaStatus,
} = require("../controllers/villaController");

router.get("/", getAllVillas);
router.get("/:id", getVillaById);
router.post("/", verifyOwner, createVilla);
router.put("/:id", verifyOwner, updateVilla);
router.delete("/:id", verifyAdmin, deleteVilla);
router.post(
  "/:id/upload-villa",
  upload.array("foto_villa", 10),
  uploadVillaImages
);
router.get("/:id/photos", getVillaImages);
router.delete("/:id/photos/:photoId", deleteVillaImage);
router.patch("/:id/change-status", verifyAdmin, updateVillaStatus);

module.exports = router;
