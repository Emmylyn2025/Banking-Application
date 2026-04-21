import { hashPassword, comparePassword, removePassword } from "../utils/password";

describe("hashPassword", () => {
  it("should return a string", async () => {
    const password = "testpassword";
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe("string");
  });

  it("should not return the original password", async () => {
    const password = "testpassword";
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
  });

  it("should produce different hashes for the same password", async () => {
    const password = "testpassword";
    const hashed1 = await hashPassword(password);
    const hashed2 = await hashPassword(password);
    expect(hashed1).not.toBe(hashed2);
  });

  it("should handle empty string", async () => {
    const password = "";
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(password);
  });

  it("should handle long passwords", async () => {
    const password = "a".repeat(1000);
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(password);
  });
});

describe("comparePassword", () => {
  it("should return true for matching password", async () => {
    const password = "testpassword";
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it("should return false for non-matching password", async () => {
    const password = "testpassword";
    const wrongPassword = "wrongpassword";
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword(wrongPassword, hashed);
    expect(isMatch).toBe(false);
  });

  it("should return false for case-sensitive mismatch", async () => {
    const password = "TestPassword";
    const wrongCase = "testpassword";
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword(wrongCase, hashed);
    expect(isMatch).toBe(false);
  });

  it("should handle empty string input", async () => {
    const password = "";
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword("", hashed);
    expect(isMatch).toBe(true);
  });

  it("should return false for empty string against hashed non-empty", async () => {
    const password = "password";
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword("", hashed);
    expect(isMatch).toBe(false);
  });
});

describe("removePassword", () => {
  it("should remove password field from user object", () => {
    const user = { id: 1, name: "John", password: "secret" };
    const result = removePassword(user);
    expect(result).toEqual({ id: 1, name: "John" });
    expect(result).not.toHaveProperty("password");
  });

  it("should return the same object if no password field", () => {
    const user = { id: 1, name: "John", email: "john@example.com" };
    const result = removePassword(user);
    expect(result).toEqual(user);
  });

  it("should handle empty object", () => {
    const user = {};
    const result = removePassword(user);
    expect(result).toEqual({});
  });

  it("should handle object with only password field", () => {
    const user = { password: "secret" };
    const result = removePassword(user);
    expect(result).toEqual({});
  });

  it("should not mutate the original object", () => {
    const user = { id: 1, name: "John", password: "secret" };
    const result = removePassword(user);
    expect(user).toHaveProperty("password");
    expect(result).not.toHaveProperty("password");
  });
});