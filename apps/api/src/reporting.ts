import type { ExpenseItem } from "./models";

export function groupTotalByMonth(expenses: readonly ExpenseItem[]) {
  const byMonth = new Map<string, number>();
  for (const e of expenses) {
    const month = e.date.slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + e.amount);
  }
  return Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));
}

export function groupTotalByCategory(expenses: readonly ExpenseItem[]) {
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amount);
  }
  return Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, total]) => ({ categoryId, total }));
}

