import removeSome from "../utils/removeUserFields";
import { userRemoval } from "../types/types";

describe("removeSome", () => {
  it("should remove password, emailVerified, email, createdAt, and name fields", () => {
    const user = {
      id: "123",
      role: "user",
      password: "secret",
      emailVerified: true,
      email: "test@example.com",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      name: "Test User",
      accountId: "acc-001",
      balance: 1000,
    };

    const result = removeSome(user as userRemoval);

    expect(result).toEqual({
      id: "123",
      role: "user",
      accountId: "acc-001",
      balance: 1000,
    });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("emailVerified");
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("name");
  });

  it("should preserve additional unexpected fields", () => {
    const user = {
      id: "456",
      role: "admin",
      password: "secret",
      emailVerified: false,
      email: "admin@example.com",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      name: "Admin User",
      metadata: { lastLogin: "2026-04-24" },
      permissions: ["read", "write"],
    };

    const result = removeSome(user as userRemoval);

    expect(result).toEqual({
      id: "456",
      role: "admin",
      metadata: { lastLogin: "2026-04-24" },
      permissions: ["read", "write"],
    });
  });

  it("should return an empty object when only removable fields are provided", () => {
    const user = {
      password: "secret",
      emailVerified: true,
      email: "only@example.com",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      name: "Only User",
    };

    const result = removeSome(user as userRemoval);

    expect(result).toEqual({});
  });

  it("should not mutate the original object", () => {
    const user = {
      id: "321",
      role: "user",
      password: "secret",
      emailVerified: false,
      email: "keep@example.com",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      name: "Keep User",
      extra: "value",
    };

    const original = { ...user };
    const result = removeSome(user as userRemoval);

    expect(result).toEqual({
      id: "321",
      role: "user",
      extra: "value",
    });
    expect(user).toEqual(original);
  });
});