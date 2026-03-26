import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { Card, ErrorBanner, Field, Input } from "../ui";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => api.listCategories() });
  const byMonthQ = useQuery({
    queryKey: ["reports", "by-month", { from, to }],
    queryFn: () =>
      api.reportByMonth({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });
  const byCategoryQ = useQuery({
    queryKey: ["reports", "by-category", { from, to }],
    queryFn: () =>
      api.reportByCategory({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  const categoryName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of catsQ.data?.items ?? []) m.set(c.categoryId, c.name);
    return m;
  }, [catsQ.data]);

  const byCategoryRows =
    byCategoryQ.data?.items.map((i) => ({
      category: categoryName.get(i.categoryId) ?? i.categoryId,
      total: i.total,
    })) ?? [];

  return (
    <div className="grid gap-4">
      <Card title="Reporting range">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="From (YYYY-MM-DD)">
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-01-01" />
          </Field>
          <Field label="To (YYYY-MM-DD)">
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-12-31" />
          </Field>
        </div>
      </Card>

      <Card title="Total spending by month">
        {byMonthQ.error ? (
          <ErrorBanner message={byMonthQ.error instanceof Error ? byMonthQ.error.message : "Failed"} />
        ) : null}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonthQ.data?.items ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="total" fill="#e2e8f0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Spending breakdown by category">
        {byCategoryQ.error ? (
          <ErrorBanner message={byCategoryQ.error instanceof Error ? byCategoryQ.error.message : "Failed"} />
        ) : null}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategoryRows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#cbd5e1" />
              <YAxis type="category" dataKey="category" width={140} stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="total" fill="#e2e8f0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

