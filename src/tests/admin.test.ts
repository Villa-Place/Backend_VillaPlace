import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Import Express app Anda
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel"; // Import model Admin

describe("Admin API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenAdmin: string;
  let adminId: mongoose.Types.ObjectId;

  const adminData = {
    nama: "Admin Utama",
    email: "admin@test.com",
    password: bcrypt.hashSync("123456", 10),
  };

  beforeAll(async () => {
    // Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Buat Admin
    const admin = await Admin.create(adminData);
    adminId = admin._id;

    const dataAdmin = await request(app).post("/api/auth/admin/login").send({
      email: "admin@test.com",
      password: "123456",
    });

    tokenAdmin = dataAdmin.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /api/admin", () => {
    it("should create a new admin", async () => {
      const newAdmin = {
        nama: "Admin Baru",
        email: "newadmin@test.com",
        password: "adminpassword",
      };

      const response = await request(app)
        .post("/api/admin")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`)
        .send(newAdmin);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("nama", newAdmin.nama);
    });
  });

  describe("GET /api/admin", () => {
    it("should return all admins", async () => {
      const response = await request(app)
        .get("/api/admin")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/admin/current-admin", () => {
    it("should return the current logged-in admin", async () => {
      const response = await request(app)
        .get("/api/admin/current-admin")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", adminData.email);
    });
  });

  describe("GET /api/admin/:id", () => {
    it("should return admin by ID", async () => {
      const response = await request(app)
        .get(`/api/admin/${adminId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", adminId.toString());
    });

    it("should return 404 if admin not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/${invalidId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("PUT /api/admin/change-password", () => {
    it("should change the admin's password", async () => {
      const response = await request(app)
        .put("/api/admin/change-password")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`)
        .send({ currentPassword: "123456", newPassword: "newpassword123" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
    });
  });

  describe("PUT /api/admin/:id", () => {
    it("should update an admin by ID", async () => {
      const updatedAdmin = {
        nama: "Admin Updated",
        email: "updatedadmin@test.com",
      };

      const response = await request(app)
        .put(`/api/admin/${adminId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`)
        .send(updatedAdmin);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("nama", updatedAdmin.nama);
      expect(response.body.data).toHaveProperty("email", updatedAdmin.email);
    });

    it("should return 404 if admin not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/admin/${invalidId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`)
        .send({ nama: "Not Found" });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("DELETE /api/admin/:id", () => {
    it("should delete admin by ID", async () => {
      const response = await request(app)
        .delete(`/api/admin/${adminId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 404 if admin not found", async () => {
      const response = await request(app)
        .delete(`/api/admin/${adminId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
