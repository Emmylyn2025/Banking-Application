import { generateTokens } from "../token/token";
import jwt from "jsonwebtoken";

describe("generateTokens", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.accessTokenSecret = "testAccessSecret";
    process.env.refreshTokenSecret = "testRefreshSecret";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return an object with accessToken and refreshToken", () => {
    const user = { id: "123", role: "user" as const };
    const tokens = generateTokens(user);
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
    expect(typeof tokens.accessToken).toBe("string");
    expect(typeof tokens.refreshToken).toBe("string");
  });

  it("should generate valid JWT tokens", () => {
    const user = { id: "123", role: "user" as const };
    const tokens = generateTokens(user);

    const decodedAccess = jwt.verify(tokens.accessToken, "testAccessSecret") as any;
    expect(decodedAccess.id).toBe("123");
    expect(decodedAccess.role).toBe("user");

    const decodedRefresh = jwt.verify(tokens.refreshToken, "testRefreshSecret") as any;
    expect(decodedRefresh.id).toBe("123");
    expect(decodedRefresh.role).toBe("user");
  });

  it("should throw error if accessTokenSecret is missing", () => {
    delete process.env.accessTokenSecret;
    const user = { id: "123", role: "user" as const };
    expect(() => generateTokens(user)).toThrow("JWT Secrets missing!");
  });

  it("should throw error if refreshTokenSecret is missing", () => {
    process.env.accessTokenSecret = "testAccessSecret";
    delete process.env.refreshTokenSecret;
    const user = { id: "123", role: "user" as const };
    expect(() => generateTokens(user)).toThrow("JWT Secrets missing!");
  });
});