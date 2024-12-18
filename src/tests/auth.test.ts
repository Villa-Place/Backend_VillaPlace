import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Import Express app Anda
import { Admin } from "../models/adminModel"; // Import model Admin
import bcrypt from "bcrypt";

describe("Authentication API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let userToken: string;
  let ownerToken: string;
  let adminToken: string;

  const userData = {
    nama: "User Test",
    email: "user@test.com",
    password: "userpassword123",
    no_telepon: "08123456789",
  };

  const ownerData = {
    nama: "Owner Test",
    email: "owner@test.com",
    password: "ownerpassword123",
    no_telepon: "08123456789",
  };

  const adminData = {
    nama: "Admin Test",
    email: "admin@test.com",
    password: bcrypt.hashSync("adminpassword123", 10),
  };

  beforeAll(async () => {
    // Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create Admin Account
    await Admin.create(adminData);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("User Authentication", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/user/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("Success");
      expect(response.body.data).toHaveProperty("email", userData.email);
    });

    it("should login the user", async () => {
      const response = await request(app)
        .post("/api/auth/user/login")
        .send({ email: userData.email, password: userData.password });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
      expect(response.body).toHaveProperty("token");
      userToken = response.body.token;
    });

    it("should logout the user", async () => {
      const response = await request(app)
        .post("/api/auth/user/logout")
        .set("Cookie", `tokenUser=${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
    });
  });

  describe("Owner Authentication", () => {
    it("should register a new owner", async () => {
      const response = await request(app)
        .post("/api/auth/owner/register")
        .send(ownerData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("Success");
      expect(response.body.data).toHaveProperty("email", ownerData.email);
    });

    it("should login the owner", async () => {
      const response = await request(app)
        .post("/api/auth/owner/login")
        .send({ email: ownerData.email, password: ownerData.password });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
      expect(response.body).toHaveProperty("token");
      ownerToken = response.body.token;
    });

    it("should logout the owner", async () => {
      const response = await request(app)
        .post("/api/auth/owner/logout")
        .set("Cookie", `tokenOwner=${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
    });
  });

  describe("Admin Authentication", () => {
    it("should login the admin", async () => {
      const response = await request(app)
        .post("/api/auth/admin/login")
        .send({ email: adminData.email, password: "adminpassword123" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
      expect(response.body).toHaveProperty("token");
      adminToken = response.body.token;
    });

    it("should logout the admin", async () => {
      const response = await request(app)
        .post("/api/auth/admin/logout")
        .set("Cookie", `toeknAdmin=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Success");
    });
  });
});
