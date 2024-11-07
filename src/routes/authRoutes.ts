// ????
import express from "express";
import {
  logoutUser,
  registerUser,
  loginUser,
} from "../controllers/auth/authUserController";
import {
  loginOwner,
  logoutOwner,
  registerOwner,
} from "../controllers/auth/authOwnerController";
import { loginAdmin, logoutAdmin } from "../controllers/auth/authAdminController";

const router = express.Router();

//! USER ROUTES
router.post("/user/register", registerUser); // Untuk user biasa
router.post("/user/login", loginUser); // Login untuk user biasa
router.post("/user/logout", logoutUser); // Logout untuk semua pengguna

//! OWNER ROUTES
router.post("/owner/register", registerOwner); // Register untuk owner
router.post("/owner/login", loginOwner); // Login untuk owner
router.post("/owner/logout", logoutOwner); // Logout untuk semua pengguna

//! ADMIN
router.post("/admin/login", loginAdmin);
router.post("/admin/logout", logoutAdmin); // Logout untuk semua pengguna

export default router;
//! dijadikan satu semua routes admin user owner
