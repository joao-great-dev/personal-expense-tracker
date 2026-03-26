import { describe, expect, it, vi, beforeEach } from "vitest";

// We don't want these tests to depend on real env in the runner.
beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret");
  vi.stubEnv("JWT_ISSUER", "pet-api");
  vi.stubEnv("JWT_AUDIENCE", "pet-web");
  vi.stubEnv("ACCESS_TOKEN_TTL_SECONDS", "60");
  vi.stubEnv("USERS_TABLE", "t-users");
  vi.stubEnv("CATEGORIES_TABLE", "t-categories");
  vi.stubEnv("EXPENSES_TABLE", "t-expenses");
});

describe("auth jwt", () => {
  it("signs and verifies access token", async () => {
    const { signAccessToken, verifyAccessToken } = await import("./auth");
    const { token } = signAccessToken({ userId: "usr_1", email: "a@b.com" });
    const claims = verifyAccessToken(token);
    expect(claims.sub).toBe("usr_1");
    expect(claims.email).toBe("a@b.com");
  });
});

