import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";
import { Pesanan } from "../models/pesananModel";
import bcrypt from "bcrypt";
import User from "../models/userModel";
import { Villa } from "../models/villaModel";

describe("Pembayaran API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenUser: string;
  let pembayaranId: string;
  let pesananId: string;
  let userId: mongoose.Types.ObjectId;
  let villaId: string;

  const userData = {
    id: "user12345",
  };

  const pembayaranData = {
    nama_pembayar: "User Test",
    email_pembayar: "user@test.com",
    kode_pembayaran: "PAY12345",
    status_pembayaran: "pending",
    metode_pembayaran: "bank_transfer",
    jumlah_pembayaran: 3000000,
    tanggal_pembayaran: new Date(),
    expiry_time: new Date(Date.now() + 3600000),
    bank: "BCA",
    nomor_va: "1234567890",
    pdf_url: "http://example.com/invoice.pdf",
  };

  const villaData = {
    nama: "Villa Test",
    deskripsi: "Villa testing purposes",
    lokasi: "Bali",
    kategori: ["keluarga"],
    fasilitas: ["wifi"],
    harga: 3000000,
    foto_villa: [],
    status: "success",
    pemilik_villa: new mongoose.Types.ObjectId(),
  };

  const pesananData = {};

  beforeAll(async () => {
    // Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Generate user token
    const user = await User.create({
      nama: "User Test",
      email: "user@test.com",
      password: await bcrypt.hash("123456", 10),
      no_telepon: "08123456789",
    });
    await user.save();
    userId = user._id;

    const response = await request(app).post("/api/auth/user/login").send({
      email: "user@test.com",
      password: "123456",
    });

    tokenUser = response.body.token;

    const villa = await Villa.create(villaData);
    villaId = villa._id as string;

    // Insert a Pesanan
    const pesanan = await Pesanan.create({
      harga: 3000000,
      jumlah_orang: 4,
      catatan: "Liburan keluarga",
      tanggal_mulai: "2024-06-01",
      tanggal_selesai: "2024-06-07",
      villa: villaId,
      user: userId,
    });
    pesananId = pesanan._id as string;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /pembayaran", () => {
    it("should create a new pembayaran with status 201", async () => {
      const newPembayaran = { ...pembayaranData, pesanan: pesananId };

      const response = await request(app)
        .post("/api/pembayaran")
        .send(newPembayaran);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("nama_pembayar", "User Test");
      pembayaranId = response.body.data._id;
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/pembayaran").send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /pembayaran", () => {
    it("should return all pembayaran with status 200", async () => {
      const response = await request(app).get("/api/pembayaran");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("GET /pembayaran/:id", () => {
    it("should return pembayaran detail by ID with status 200", async () => {
      const response = await request(app).get(
        `/api/pembayaran/${pembayaranId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", pembayaranId);
      expect(response.body.data).toHaveProperty("status_pembayaran", "pending");
    });

    it("should return 404 if pembayaran is not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/pembayaran/${invalidId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("PUT /pembayaran/:id", () => {
    it("should update pembayaran by ID with status 200", async () => {
      const updatedPembayaran = {
        nama_pembayar: "User Test",
        email_pembayar: "user@test.com",
        kode_pembayaran: "PAY12345",
        status_pembayaran: "success",
        metode_pembayaran: "bank_transfer",
        jumlah_pembayaran: 3000000,
        tanggal_pembayaran: new Date(),
        expiry_time: new Date(Date.now() + 3600000),
        bank: "BCA",
        nomor_va: "1234567890",
        pdf_url: "http://example.com/invoice.pdf",
        pesanan: pesananId,
      };

      const response = await request(app)
        .put(`/api/pembayaran/${pembayaranId}`)
        .send(updatedPembayaran);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("status_pembayaran", "success");
    });

    it("should return 400 if required fields are missing", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/pembayaran/${invalidId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });
  });

  describe("DELETE /pembayaran/:id", () => {
    it("should delete pembayaran by ID with status 200", async () => {
      const response = await request(app).delete(
        `/api/pembayaran/${pembayaranId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 404 if pembayaran is not found", async () => {
      const response = await request(app).delete(
        `/api/pembayaran/${pembayaranId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
