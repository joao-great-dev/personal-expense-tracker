import { describe, expect, it, vi } from "vitest";

describe("api base url", () => {
  it("requires VITE_API_BASE_URL to be a url", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "not-a-url");
    const { getEnv } = await import("./env");
    expect(() => getEnv()).toThrow(/Missing\/invalid frontend env/);
  });
});

