import { Router } from "express";
const { verifyAdmin } = require("../middleware/verifyToken");
const router = Router();

const {
createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById,
} = require("../controllers/admin/adminController");

router.post("/", createAdmin);
router.get("/", verifyAdmin, getAllAdmins);
router.get("/:id", verifyAdmin, getAdminById);
router.put("/:id", verifyAdmin, updateAdminById);
router.delete("/:id", verifyAdmin, deleteAdminById);

module.exports = router;
