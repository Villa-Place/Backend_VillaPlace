// __tests__/villa.test.ts
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";
import { Villa } from "../models/villaModel";
import Owner from "../models/ownerModel";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel"; // Import model Admin

describe("Villa API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let villaId: string; // Untuk menyimpan ID villa
  let tokenOwner: string;
  let tokenAdmin: string;

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
    const villa = await Villa.insertMany(villaData);
    villaId = villa[0]._id as string;

    // Buat token owner untuk testing
    const owner = new Owner({
      nama: "Owner Test",
      email: "owner@test.com",
      password: await bcrypt.hash("12345678", 10),
      no_telepon: "08123456789",
    });
    await owner.save();

    const response = await request(app).post("/api/auth/owner/login").send({
      email: "owner@test.com",
      password: "12345678",
    });

    tokenOwner = response.body.token;

    await Admin.create({
      nama: "Admin Utama",
      email: "admin@test.com",
      password: await bcrypt.hash("12345678", 10),
    });

    const dataAdmin = await request(app).post("/api/auth/admin/login").send({
      email: "admin@test.com",
      password: "12345678",
    });

    tokenAdmin = dataAdmin.body.token;
  });

  afterAll(async () => {
    // Bersihkan dan tutup koneksi MongoDB
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /villa", () => {
    it("should return all villa with status 200", async () => {
      const response = await request(app).get("/api/villa");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      expect(response.body.data[0]).toHaveProperty("nama", "Villa Indah");
      expect(response.body.data[1]).toHaveProperty("nama", "Villa Mewah");
    });

    it("should return filtered villas based on searchQuery", async () => {
      const response = await request(app)
        .get("/api/villa")
        .query({ searchQuery: "Bali" });

      console.log(response.body.data, "ini response");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty("lokasi", "Bali");
    });

    it("should return filtered villas based on harga_min and harga_max", async () => {
      const response = await request(app).get("/api/villa").query({
        harga_min: 2000000,
        harga_max: 3000000,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();
      response.body.data.forEach((villa: any) => {
        expect(villa.harga).toBeGreaterThanOrEqual(2000000);
        expect(villa.harga).toBeLessThanOrEqual(3000000);
      });
    });
  });
  describe("GET /villa/owner", () => {
    it("should return all villa Owner with status 200", async () => {
      const response = await request(app)
        .get("/api/villa")
        .set("Cookie", `tokenOwner=${tokenOwner}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      expect(response.body.data[0]).toHaveProperty("nama", "Villa Indah");
      expect(response.body.data[1]).toHaveProperty("nama", "Villa Mewah");
    });
  });
  describe("GET /villa/admin", () => {
    it("should return all villa Admin with status 200", async () => {
      const response = await request(app)
        .get("/api/villa")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      expect(response.body.data[0]).toHaveProperty("nama", "Villa Indah");
      expect(response.body.data[1]).toHaveProperty("nama", "Villa Mewah");
    });
  });

  describe("GET /villa/:id", () => {
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

  describe("POST /villa", () => {
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

  describe("PUT /villa/:id", () => {
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

  describe("DELETE /villa/:id", () => {
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
