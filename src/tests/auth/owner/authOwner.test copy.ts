import request from "supertest";
import app from "../../../app"; // Pastikan Anda mengarah ke file utama Express Anda
import Owner from "../../../models/ownerModel";
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://feryyuliarahman11:villaPlace@cluster0.jjoun.mongodb.net/test";

describe("Owner Authentication", () => {
  beforeAll(async () => {
    await mongoose.connect(`${MONGO_URI}`);
    await Owner.deleteMany({});
  });

  // Tutup koneksi database setelah test selesai
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("Register Owner", () => {
    it("should register an owner successfully", async () => {
      const ownerData = {
        nama: "John Owner",
        email: "owner@example.com",
        password: "password123",
        no_telepon: "081234567890",
      };

      const res = await request(app)
        .post("/api/auth/owner/register")
        .send(ownerData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("Owner berhasil dibuat");
      expect(res.body.data.nama).toBe(ownerData.nama);
      expect(res.body.data.email).toBe(ownerData.email);
      expect(res.body.data.no_telepon).toBe(ownerData.no_telepon);

      const ownerInDb = await Owner.findOne({ email: ownerData.email });
      expect(ownerInDb).not.toBeNull();
    });

    it("should fail if email is already in use", async () => {
      const ownerData = {
        nama: "Duplicate Owner",
        email: "owner@example.com",
        password: "password123",
        no_telepon: "081234567891",
      };

      const res = await request(app)
        .post("/api/auth/owner/register")
        .send(ownerData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe(
        "Email sudah digunakan oleh owner lain!"
      );
    });

    it("should fail if no_telepon is already in use", async () => {
      const ownerData = {
        nama: "Duplicate Phone",
        email: "owner2@example.com",
        password: "password123",
        no_telepon: "081234567890",
      };

      const res = await request(app)
        .post("/api/auth/owner/register")
        .send(ownerData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.no_telepon).toBe(
        "Nomor telepon sudah digunakan oleh owner lain!"
      );
    });

    it("should fail if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/owner/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.nama).toBe("Nama harus diisi!");
      expect(res.body.errors.email).toBe("Email harus diisi!");
      expect(res.body.errors.password).toBe("Password harus diisi!");
      expect(res.body.errors.no_telepon).toBe("Nomor telepon harus diisi!");
    });
  });

  describe("Login Owner", () => {
    it("should login an owner successfully", async () => {
      const ownerData = {
        email: "owner@example.com",
        password: "password123",
      };

      const res = await request(app)
        .post("/api/auth/owner/login")
        .send(ownerData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("Berhasil login");
      expect(res.body.token).toBeDefined();
    });

    it("should fail if email is not found", async () => {
      const ownerData = {
        email: "notfound@example.com",
        password: "password123",
      };

      const res = await request(app)
        .post("/api/auth/owner/login")
        .send(ownerData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe("Email tidak ditemukan!");
    });

    it("should fail if password is incorrect", async () => {
      const ownerData = {
        email: "owner@example.com",
        password: "wrongpassword",
      };

      const res = await request(app)
        .post("/api/auth/owner/login")
        .send(ownerData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.password).toBe(
        "Password yang Anda masukkan salah!"
      );
    });

    it("should fail if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/owner/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.email).toBe("Email harus diisi!");
      expect(res.body.errors.password).toBe("Password harus diisi!");
    });
  });

  describe("Logout Owner", () => {
    it("should logout an owner successfully", async () => {
      const res = await request(app).post("/api/auth/owner/logout");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.message).toBe("Logout berhasil");
    });
  });
});
