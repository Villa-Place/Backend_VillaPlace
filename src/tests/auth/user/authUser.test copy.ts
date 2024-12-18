import request from "supertest";
import app from "../../../app"; // Pastikan Anda mengarah ke file utama Express Anda
import User from "../../../models/userModel";
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://feryyuliarahman11:villaPlace@cluster0.jjoun.mongodb.net/test";

describe("User Authentication", () => {
  beforeAll(async () => {
    await mongoose.connect(`${MONGO_URI}`);
    await User.deleteMany({});
  });

  // Tutup koneksi database setelah test selesai
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("Register User", () => {
    it("should register an user successfully", async () => {
      const userData = {
        nama: "John User",
        email: "user@example.com",
        password: "password123",
        no_telepon: "081234567890",
      };

      const res = await request(app)
        .post("/api/auth/user/register")
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("User berhasil dibuat");
      expect(res.body.data.nama).toBe(userData.nama);
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.no_telepon).toBe(userData.no_telepon);

      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
    });

    it("should fail if email is already in use", async () => {
      const userData = {
        nama: "Duplicate User",
        email: "user@example.com",
        password: "password123",
        no_telepon: "081234567891",
      };

      const res = await request(app)
        .post("/api/auth/user/register")
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe(
        "Email sudah digunakan oleh user lain!"
      );
    });

    it("should fail if no_telepon is already in use", async () => {
      const userData = {
        nama: "Duplicate Phone",
        email: "user2@example.com",
        password: "password123",
        no_telepon: "081234567890",
      };

      const res = await request(app)
        .post("/api/auth/user/register")
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.no_telepon).toBe(
        "Nomor telepon sudah digunakan oleh user lain!"
      );
    });

    it("should fail if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/user/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.nama).toBe("Nama harus diisi!");
      expect(res.body.errors.email).toBe("Email harus diisi!");
      expect(res.body.errors.password).toBe("Password harus diisi!");
      expect(res.body.errors.no_telepon).toBe("Nomor telepon harus diisi!");
    });
  });

  describe("Login User", () => {
    it("should login an user successfully", async () => {
      const userData = {
        email: "user@example.com",
        password: "password123",
      };

      const res = await request(app)
        .post("/api/auth/user/login")
        .send(userData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("Berhasil login");
      expect(res.body.token).toBeDefined();
    });

    it("should fail if email is not found", async () => {
      const userData = {
        email: "notfound@example.com",
        password: "password123",
      };

      const res = await request(app)
        .post("/api/auth/user/login")
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe("Email tidak ditemukan!");
    });

    it("should fail if password is incorrect", async () => {
      const userData = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      const res = await request(app)
        .post("/api/auth/user/login")
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.password).toBe(
        "Password yang Anda masukkan salah!"
      );
    });

    it("should fail if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/user/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe("Email harus diisi!");
      expect(res.body.errors.password).toBe("Password harus diisi!");
    });
  });

  describe("Logout User", () => {
    it("should logout an user successfully", async () => {
      const res = await request(app).post("/api/auth/user/logout");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("Logout berhasil");
    });
  });
});
