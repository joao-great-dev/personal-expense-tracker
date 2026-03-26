import { describe, expect, it } from "vitest";
import { groupTotalByCategory, groupTotalByMonth } from "./reporting";
import type { ExpenseItem } from "./models";

const e = (partial: Partial<ExpenseItem>): ExpenseItem => ({
  userId: "usr_1",
  expenseId: "exp_1",
  amount: 0,
  description: "x",
  categoryId: "cat_1",
  date: "2026-01-01",
  gsi1pk: "usr_1",
  gsi1sk: "2026-01-01#exp_1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...partial,
});

describe("reporting", () => {
  it("groups totals by month", () => {
    const items = groupTotalByMonth([
      e({ amount: 10, date: "2026-03-01" }),
      e({ amount: 5, date: "2026-03-15" }),
      e({ amount: 2, date: "2026-04-02" }),
    ]);
    expect(items).toEqual([
      { month: "2026-03", total: 15 },
      { month: "2026-04", total: 2 },
    ]);
  });

  it("groups totals by category", () => {
    const items = groupTotalByCategory([
      e({ amount: 10, categoryId: "cat_food" }),
      e({ amount: 5, categoryId: "cat_food" }),
      e({ amount: 2, categoryId: "cat_transport" }),
    ]);
    expect(items).toEqual([
      { categoryId: "cat_food", total: 15 },
      { categoryId: "cat_transport", total: 2 },
    ]);
  });
});

