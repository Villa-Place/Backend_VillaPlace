import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

//! CURD OWNER
export const verifyOwner = (
  req: Request, // Mengganti Request dengan AuthRequest
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.tokenOwner;
    if (!token) {
      return res.status(403).json({
        status: "Failed",
        message: "Anda tidak memiliki akses! ",
      });
    }
    const owner = jwt.verify(token, JWT_SECRET);
    req.body.owner = owner;
    next();
  } catch (error) {
    console.log(error);
  }
};

//

//! fitur admin
export const verifyAdmin = (
  req: Request, // Mengganti Request dengan AuthRequest
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.tokenAdmin;
    if (!token) {
      return res.status(403).json({
        status: "Failed",
        message: "Anda tidak memiliki akses!/ anda belom login!",
      });
    }
    const admin = jwt.verify(token, JWT_SECRET);
    req.body.admin = admin;
    next();
  } catch (error) {
    console.log(error);
  }
};

//! LOGIN USER

export const verifyUserLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.tokenUser;
    if (!token) {
      return res.status(403).json({
        status: "Failed",
        message: "Anda belum melakukan login!",
      });
    }
    const userLogin = jwt.verify(token, JWT_SECRET);
    req.body.userLogin = userLogin;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error during authentication" });
  }
};
// ???
