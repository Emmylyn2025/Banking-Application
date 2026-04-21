import respond from "../utils/apiResponse";

describe("respond", () => {
  it("should return an apiResponse object with success true", () => {
    const result = respond(true, "Success message", { key: "value" });
    expect(result).toEqual({
      success: true,
      message: "Success message",
      data: { key: "value" }
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Success message");
    expect(result.data).toEqual({ key: "value" });
  });

  it("should return an apiResponse object with success false", () => {
    const result = respond(false, "Error message", null);
    expect(result).toEqual({
      success: false,
      message: "Error message",
      data: null
    });
  });

  it("should handle undefined data", () => {
    const result = respond(true, "No data", undefined);
    expect(result).toEqual({
      success: true,
      message: "No data",
      data: undefined
    });
  });

  it("should handle different data types", () => {
    const result = respond(true, "String data", "hello");
    expect(result.data).toBe("hello");

    const result2 = respond(true, "Number data", 42);
    expect(result2.data).toBe(42);

    const result3 = respond(true, "Array data", [1, 2, 3]);
    expect(result3.data).toEqual([1, 2, 3]);
  });

  it("should have the correct type structure", () => {
    const result = respond(true, "Test", {});
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
    expect(result).toHaveProperty("data");
  });
});

