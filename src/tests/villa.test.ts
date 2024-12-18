// __tests__/villa.test.ts
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";
import { Villa } from "../models/villaModel";
import Owner from "../models/ownerModel";
import bcrypt from "bcrypt";

describe("Villa API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let villaId: string; // Untuk menyimpan ID villa
  let tokenOwner: string;

  const villaData = [
    {
      nama: "Villa Indah",
      deskripsi: "Villa dengan pemandangan indah",
      lokasi: "Bali",
      kategori: ["keluarga", "liburan"],
      fasilitas: ["kolam renang", "wifi"],
      harga: 2000000,
      foto_villa: [],
      pemilik_villa: new mongoose.Types.ObjectId(),
      status: "success",
      ulasan: [],
    },
    {
      nama: "Villa Mewah",
      deskripsi: "Villa mewah dengan fasilitas lengkap",
      lokasi: "Lombok",
      kategori: ["mewah", "liburan"],
      fasilitas: ["wifi", "gym"],
      harga: 5000000,
      foto_villa: [],
      pemilik_villa: new mongoose.Types.ObjectId(),
      status: "success",
      ulasan: [],
    },
  ];

  beforeAll(async () => {
    // Setup MongoMemoryServer sebagai database mock
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    // Insert data villa untuk keperluan testing
    const villas = await Villa.insertMany(villaData);
    villaId = villas[0]._id as string;

    // Buat token owner untuk testing
    const owner = new Owner({
      nama: "Owner Test",
      email: "owner@test.com",
      password: await bcrypt.hash("123456", 10),
      no_telepon: "08123456789",
    });
    await owner.save();

    const response = await request(app).post("/api/auth/owner/login").send({
      email: "owner@test.com",
      password: "123456",
    });

    tokenOwner = response.body.token;
  });

  afterAll(async () => {
    // Bersihkan dan tutup koneksi MongoDB
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /villas", () => {
    it("should return all villas with status 200", async () => {
      const response = await request(app).get("/api/villa");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      expect(response.body.data[0]).toHaveProperty("nama", "Villa Indah");
      expect(response.body.data[1]).toHaveProperty("nama", "Villa Mewah");
    });
  });

  describe("GET /villas/:id", () => {
    it("should return villa detail by ID with status 200", async () => {
      const response = await request(app).get(`/api/villa/${villaId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("nama", "Villa Indah");
      expect(response.body.data).toHaveProperty("lokasi", "Bali");
      expect(response.body.data).toHaveProperty("harga", 2000000);
    });

    it("should return 404 if villa is not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/villa/${invalidId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Villa not found");
    });

    it("should return 500 if ID format is invalid", async () => {
      const invalidFormatId = "123456";
      const response = await request(app).get(`/api/villa/${invalidFormatId}`);

      expect(response.status).toBe(500);
      expect(response.body.status).toBe("error");
    });
  });

  describe("POST /villas", () => {
    it("should create a new villa with status 201", async () => {
      const newVilla = {
        nama: "Villa Baru",
        deskripsi: "Villa baru dengan fasilitas lengkap",
        lokasi: "Bali",
        kategori: ["keluarga", "liburan"],
        fasilitas: ["wifi", "kolam renang"],
        harga: 3000000,
        pemilik_villa: new mongoose.Types.ObjectId(),
      };

      const response = await request(app)
        .post("/api/villa")
        .set("Cookie", `tokenOwner=${tokenOwner}`)
        .send(newVilla);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("nama", "Villa Baru");
      expect(response.body.data).toHaveProperty("harga", 3000000);
    });

    it("should return 403 if token is invalid", async () => {
      const response = await request(app).post("/api/villa").send({});

      expect(response.status).toBe(403);
      expect(response.body.status).toBe("Failed");
    });
  });

  describe("PUT /villas/:id", () => {
    it("should update villa by ID with status 200", async () => {
      const updatedVilla = {
        nama: "Villa Indah Updated",
        deskripsi: "Villa dengan pemandangan indah",
        lokasi: "Bali",
        kategori: ["keluarga", "liburan"],
        fasilitas: ["kolam renang", "wifi"],
        harga: 2500000,
      };

      const response = await request(app)
        .put(`/api/villa/${villaId}`)
        .set("Cookie", `tokenOwner=${tokenOwner}`)
        .send(updatedVilla);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("nama", "Villa Indah Updated");
      expect(response.body.data).toHaveProperty("harga", 2500000);
    });

    it("should return 403 if token is empty", async () => {
      const response = await request(app).put(`/api/villa/${villaId}`).send({});

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("Failed");
    });
  });

  describe("DELETE /villas/:id", () => {
    it("should delete villa by ID with status 200", async () => {
      const response = await request(app)
        .delete(`/api/villa/${villaId}`)
        .set("Cookie", `tokenOwner=${tokenOwner}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 403 if token is invalid", async () => {
      const response = await request(app)
        .delete(`/api/villa/${villaId}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("Failed");
    });
  });
});
