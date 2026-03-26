import { describe, expect, it } from "vitest";
import { createExpenseRequestSchema } from "./schemas";

describe("shared schemas", () => {
  it("validates createExpenseRequestSchema", () => {
    const result = createExpenseRequestSchema.safeParse({
      amount: 12.5,
      description: "Coffee",
      categoryId: "cat_123",
      date: "2026-03-26",
    });
    expect(result.success).toBe(true);
  });
});

