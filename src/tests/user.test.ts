import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Import Express app Anda
import User from "../models/userModel";
import { Admin } from "../models/adminModel";
import bcrypt from "bcrypt";

describe("User API Endpoints", () => {
  let mongoServer: MongoMemoryServer;
  let tokenAdmin: string;
  let tokenUser: string;
  let userId: mongoose.Types.ObjectId;

  const userData = {
    nama: "User 1",
    email: "user1@test.com",
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

    const user = await User.create(userData);
    await user.save();
    userId = user._id;

    const response = await request(app).post("/api/auth/user/login").send({
      email: "user1@test.com",
      password: "123456",
    });

    tokenUser = response.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /user", () => {
    it("should return all owners for admin", async () => {
      const response = await request(app)
        .get("/api/user")
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /user/current-user", () => {
    it("should return current user data", async () => {
      const response = await request(app)
        .get("/api/user/current-user")
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", userData.email);
    });
  });

  describe("GET /user/:id", () => {
    it("should return an user by ID", async () => {
      const response = await request(app)
        .get(`/api/user/${userId}`)
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", userData.email);
    });

    it("should return 404 if user not found", async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/user/${invalidId}`)
        .set("Cookie", `tokenUser=${tokenUser}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /user/:id", () => {
    it("should update user details", async () => {
      const updatedData = { nama: "Updated User", no_telepon: "08111111111" };
      const response = await request(app)
        .put(`/api/user/${userId}`)
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("nama", updatedData.nama);
    });
  });

  describe("PUT /user/change-password", () => {
    it("should change user password", async () => {
      const response = await request(app)
        .put("/api/user/change-password")
        .set("Cookie", `tokenUser=${tokenUser}`)
        .send({
          currentPassword: "123456",
          newPassword: "newpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBe("Password successfully updated");
    });
  });

  describe("DELETE /user/:id", () => {
    it("should delete an user", async () => {
      const response = await request(app)
        .delete(`/api/user/${userId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User successfully deleted");
    });

    it("should return 404 if user not found", async () => {
      const response = await request(app)
        .delete(`/api/user/${userId}`)
        .set("Cookie", `tokenAdmin=${tokenAdmin}`);

      expect(response.status).toBe(404);
    });
  });
});
