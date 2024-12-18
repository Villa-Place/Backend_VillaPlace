import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Import Express app Anda
import Owner from "../models/ownerModel";
import { Admin } from "../models/adminModel";
import bcrypt from "bcrypt";

describe("Owner API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenAdmin: string;
  let tokenOwner: string;
  let ownerId: mongoose.Types.ObjectId;

  const ownerData = {
    nama: "Owner 1",
    email: "owner1@test.com",
    password: bcrypt.hashSync("123456", 10),
    no_telepon: "08123456789",
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

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

    const owner = await Owner.create(ownerData);
    await owner.save();
    ownerId = owner._id;

    const response = await request(app).post("/api/auth/owner/login").send({
      email: "owner1@test.com",
      password: "123456",
    });

    tokenOwner = response.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /owner", () => {
    it("should return all owners for admin", async () => {
      const response = await request(app)
        .get("/api/owner")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /owner/current-owner", () => {
    it("should return current owner data", async () => {
      const response = await request(app)
        .get("/api/owner/current-owner")
        .set("Cookie", `tokenOwner=${tokenOwner}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", ownerData.email);
    });
  });

  describe("GET /owner/:id", () => {
    it("should return an owner by ID", async () => {
      const response = await request(app)
        .get(`/api/owner/${ownerId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", ownerData.email);
    });

    it("should return 404 if owner not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/owner/${invalidId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /owner/:id", () => {
    it("should update owner details", async () => {
      const updatedData = { nama: "Updated Owner", no_telepon: "08111111111" };
      const response = await request(app)
        .put(`/api/owner/${ownerId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("nama", updatedData.nama);
    });
  });

  describe("PUT /owner/change-password", () => {
    it("should change owner password", async () => {
      const response = await request(app)
        .put("/api/owner/change-password")
        .set("Cookie", `tokenOwner=${tokenOwner}`)
        .send({
          currentPassword: "123456",
          newPassword: "newpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password berhasil diperbarui");
    });
  });

  describe("DELETE /owner/:id", () => {
    it("should delete an owner", async () => {
      const response = await request(app)
        .delete(`/api/owner/${ownerId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Owner successfully deleted");
    });

    it("should return 404 if owner not found", async () => {
      const response = await request(app)
        .delete(`/api/owner/${ownerId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
    });
  });
});
