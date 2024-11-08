import { Router } from "express";
const { verifyUserLogin } = require("../middleware/verifyToken");
const router = Router();
const {
  getAllFavorite,
  createFavorite,
  deleteFavorite,
} = require("../controllers/pengguna/favoriteController");
router.get("/", verifyUserLogin, getAllFavorite);
router.post("/", verifyUserLogin, createFavorite);
router.delete("/:id", verifyUserLogin, deleteFavorite);

module.exports = router;
