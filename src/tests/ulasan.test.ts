import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Import Express app Anda
import User from "../models/userModel";
import { Villa } from "../models/villaModel";
import { Pesanan } from "../models/pesananModel";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel";

describe("Ulasan API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenUser: string;
  let tokenAdmin: string;
  let userId: mongoose.Types.ObjectId;
  let villaId: string;
  let pesananId: string;
  let ulasanId: string;

  const userData = {
    nama: "User Test",
    email: "user@test.com",
    password: bcrypt.hashSync("123456", 10),
    no_telepon: "08123456789",
  };

  const villaData = {
    nama: "Villa Bagus",
    deskripsi: "Villa yang sangat indah",
    lokasi: "Bali",
    harga: 2000000,
    kategori: ["keluarga"],
    fasilitas: ["wifi"],
    pemilik_villa: new mongoose.Types.ObjectId(),
  };

  const pesananData = {
    harga: 3000000,
    jumlah_orang: 2,
    catatan: "Butuh villa yang bersih",
    tanggal_mulai: "2024-12-01",
    tanggal_selesai: "2024-12-07",
  };

  beforeAll(async () => {
    // Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a User
    const user = await User.create({
      nama: "User Test",
      email: "user@test.com",
      password: await bcrypt.hash("123456", 10),
      no_telepon: "08123456789",
    });
    await user.save();
    userId = user._id;

    // Create Admin
    const admin = await Admin.create({
      nama: "Admin Test",
      email: "admin@gmail.com",
      password: await bcrypt.hash("123456", 10),
    });

    await admin.save();

    // Create token
    const dataAdmin = await request(app).post("/api/auth/admin/login").send({
      email: "admin@gmail.com",
      password: "123456",
    });

    tokenAdmin = dataAdmin.body.token;

    const response = await request(app).post("/api/auth/user/login").send({
      email: "user@test.com",
      password: "123456",
    });

    tokenUser = response.body.token;

    // Buat Villa
    const villa = await Villa.create(villaData);
    villaId = villa._id as string;

    // Buat Pesanan
    const pesanan = await Pesanan.create({
      ...pesananData,
      user: userId,
      villa: villaId,
    });
    pesananId = pesanan._id as string;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /ulasan", () => {
    it("should create a new ulasan", async () => {
      const newUlasan = {
        komentar: "Villa sangat bersih dan nyaman",
        rating: 5,
        user: userId,
        villa: villaId,
        pesanan: pesananId,
      };

      const response = await request(app)
        .post("/api/ulasan")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send(newUlasan);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("komentar", newUlasan.komentar);
      expect(response.body.data).toHaveProperty("rating", newUlasan.rating);
      ulasanId = response.body.data._id;
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/ulasan")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Villa ID is required.");
    });
  });

  describe("GET /ulasan", () => {
    it("should return all ulasan", async () => {
      const response = await request(app)
        .get("/api/ulasan")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /ulasan/:id", () => {
    it("should update an existing ulasan", async () => {
      const updatedUlasan = {
        komentar: "Villa sangat indah dan pelayanan ramah",
        rating: 4,
      };

      const response = await request(app)
        .put(`/api/ulasan/${ulasanId}`)
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send(updatedUlasan);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty(
        "komentar",
        updatedUlasan.komentar
      );
      expect(response.body.data).toHaveProperty("rating", updatedUlasan.rating);
    });

    it("should return 404 if ulasan not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/ulasan/${invalidId}`)
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send({ komentar: "Test" });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("DELETE /ulasan/:id", () => {
    it("should delete ulasan by ID", async () => {
      const response = await request(app)
        .delete(`/api/ulasan/${ulasanId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 404 if ulasan not found", async () => {
      const response = await request(app)
        .delete(`/api/ulasan/${ulasanId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
