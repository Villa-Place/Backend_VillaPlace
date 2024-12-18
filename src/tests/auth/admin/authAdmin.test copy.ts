import request from "supertest";
import app from "../../../app"; // Pastikan file utama Express Anda diimport di sini
import mongoose from "mongoose";
import { Admin } from "../../../models/adminModel";
import bcrypt from "bcrypt";

let testAdmin: any;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://feryyuliarahman11:villaPlace@cluster0.jjoun.mongodb.net/test";

beforeAll(async () => {
  // Koneksi ke database
  await mongoose.connect(`${MONGO_URI}`);

  // Buat admin dengan password yang di-hash
  const hashedPassword = await bcrypt.hash("password123", 10);
  testAdmin = await Admin.create({
    nama: "Admin Test",
    email: "admintest@example.com",
    password: hashedPassword,
    foto_profile: "https://example.com/profile.jpg",
  });
});

afterAll(async () => {
  await Admin.deleteMany({});
  await mongoose.connection.close();
});

describe("Admin Authentication", () => {
  it("should login successfully with correct email and password", async () => {
    const res = await request(app).post("/api/auth/admin/login").send({
      email: "admintest@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "Success");
    expect(res.body).toHaveProperty("token");
  });

  it("should fail to login with incorrect email", async () => {
    const res = await request(app).post("/api/auth/admin/login").send({
      email: "wrongemail@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "Failed");
    expect(res.body.message).toBe("Email yang anda masukan salah");
  });

  it("should fail to login with incorrect password", async () => {
    const res = await request(app).post("/api/auth/admin/login").send({
      email: "admintest@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "Failed");
    expect(res.body.message).toBe("Password yang anda masukan salah");
  });
});
