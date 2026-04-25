import crypto from "crypto";
import { generatePasswordResetToken } from "../token/token";

describe("generatePasswordResetToken", () => {
  it("should return a non-empty string", async () => {
    const token = await generatePasswordResetToken();
    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64);
    expect(token).not.toBe("");
  });

  it("should return a valid hexadecimal string", async () => {
    const token = await generatePasswordResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should generate different tokens on repeated calls", async () => {
    const token1 = await generatePasswordResetToken();
    const token2 = await generatePasswordResetToken();
    expect(token1).not.toBe(token2);
  });

  it("should call crypto.randomBytes with 32 bytes", async () => {
    const randomBytesSpy = jest.spyOn(crypto, "randomBytes");
    await generatePasswordResetToken();
    expect(randomBytesSpy).toHaveBeenCalledWith(32);
    randomBytesSpy.mockRestore();
  });
});