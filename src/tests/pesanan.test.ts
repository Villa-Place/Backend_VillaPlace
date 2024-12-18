import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";
import { Pesanan } from "../models/pesananModel";
import User from "../models/userModel";
import { Villa } from "../models/villaModel";
import bcrypt from "bcrypt";

describe("Pesanan API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenUser: string;
  let userId: mongoose.Types.ObjectId;
  let villaId: string;
  let pesananId: string;

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

  beforeAll(async () => {
    // Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    await User.deleteMany({});
    await Villa.deleteMany({});
    await Pesanan.deleteMany({});

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

    // Insert a Villa
    const villa = await Villa.create(villaData);
    villaId = villa._id as string;
  });

  afterAll(async () => {
    // Bersihkan dan tutup koneksi MongoDB
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /pesanan", () => {
    it("should create a new pesanan with status 201", async () => {
      const newPesanan = {
        harga: 3000000,
        jumlah_orang: 4,
        catatan: "Liburan keluarga",
        tanggal_mulai: "2024-06-01",
        tanggal_selesai: "2024-06-07",
        user: userId,
        villa: villaId,
      };

      const response = await request(app)
        .post("/api/pesanan")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send(newPesanan);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("harga", 3000000);
      expect(response.body.data).toHaveProperty("jumlah_orang", 4);
      pesananId = response.body.data._id; // Simpan ID pesanan untuk test berikutnya
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/pesanan")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send({
          jumlah_orang: 4,
          catatan: "Liburan keluarga",
          tanggal_mulai: "2024-06-01",
          tanggal_selesai: "2024-06-07",
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /pesanan", () => {
    it("should return all pesanan with status 200", async () => {
      const response = await request(app).get("/api/pesanan");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("GET /pesanan/:id", () => {
    it("should return pesanan detail by ID with status 200", async () => {
      const response = await request(app).get(`/api/pesanan/${pesananId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", pesananId);
      expect(response.body.data).toHaveProperty("harga", 3000000);
    });

    it("should return 404 if pesanan is not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/pesanan/${invalidId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("PUT /pesanan/:id", () => {
    it("should update pesanan by ID with status 200", async () => {
      const updatedPesanan = { catatan: "Liburan keluarga bahagia" };

      const response = await request(app)
        .put(`/api/pesanan/${pesananId}`)
        .send(updatedPesanan);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty(
        "catatan",
        "Liburan keluarga bahagia"
      );
    });

    it("should return 404 if pesanan is not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/pesanan/${invalidId}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("DELETE /pesanan/:id", () => {
    it("should delete pesanan by ID with status 200", async () => {
      const response = await request(app).delete(`/api/pesanan/${pesananId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 404 if pesanan is not found", async () => {
      const response = await request(app).delete(`/api/pesanan/${pesananId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
