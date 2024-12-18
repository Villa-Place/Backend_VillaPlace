import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";
import User from "../models/userModel";
import { Villa } from "../models/villaModel";
import bcrypt from "bcrypt";

describe("Favorite API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenUser: string;
  let userId: mongoose.Types.ObjectId;
  let villaId: string;
  let favoriteId: string;

  const villaData = {
    nama: "Villa Indah",
    deskripsi: "Villa yang sangat indah",
    lokasi: "Bali",
    harga: 2000000,
    kategori: ["keluarga"],
    fasilitas: ["wifi"],
    pemilik_villa: new mongoose.Types.ObjectId(),
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

    const response = await request(app).post("/api/auth/user/login").send({
      email: "user@test.com",
      password: "123456",
    });

    tokenUser = response.body.token;

    // Create a Villa
    const villa = await Villa.create(villaData);
    villaId = villa._id as string;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /favorite", () => {
    it("should create a new favorite", async () => {
      const newFavorite = { user: userId, villa: villaId };

      const response = await request(app)
        .post("/api/favorite")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send(newFavorite);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("user", userId.toString());
      expect(response.body.data).toHaveProperty("villa", villaId.toString());
      favoriteId = response.body.data._id;
    });

    it("should return 403 if user is not authenticated", async () => {
      const response = await request(app).post("/api/favorite").send({});

      expect(response.status).toBe(403);
      expect(response.body.status).toBe("Failed");
    });
  });

  describe("GET /favorite", () => {
    it("should return all favorites", async () => {
      const response = await request(app)
        .get("/api/favorite")
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("DELETE /favorite/:id", () => {
    it("should delete favorite by ID", async () => {
      const response = await request(app)
        .delete(`/api/favorite/${favoriteId}`)
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 404 if favorite is not found", async () => {
      const response = await request(app)
        .delete(`/api/favorite/${favoriteId}`)
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
