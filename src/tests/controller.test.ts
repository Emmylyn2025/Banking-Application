import * as userService from "../services/user.service";
import app from "../app";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.accessTokenSecret = process.env.accessTokenSecret || "test-access-secret";
process.env.refreshTokenSecret = process.env.refreshTokenSecret || "test-refresh-secret";

jest.mock("../services/user.service");

jest.mock("../Redis/utilityRedis", () => ({
  saveInRedis: jest.fn().mockResolvedValue(undefined),
  getFromRedis: jest.fn().mockResolvedValue(null),
}));

describe("User Controller", () => {
  const basePath = "/banking";
  const adminToken = jwt.sign({ id: "admin-id", role: "admin" }, process.env.accessTokenSecret as string, { expiresIn: "1h" });
  const getUserByIdMock = userService.getUserById as jest.Mock;

  describe("GET /users/:id", () => {
    it("should return 200 and user data when the user exists", async () => {
      const userId = "8a2b9d0f-95e5-4cca-8bd8-9d28bb06817f";
      const user = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        role: "user",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      getUserByIdMock.mockResolvedValueOnce(user);

      const response = await request(app)
        .get(`${basePath}/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "User retrieved successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
      expect(response.body.data).not.toHaveProperty("password");
      expect(getUserByIdMock).toHaveBeenCalledWith(userId);
    });
  });
});