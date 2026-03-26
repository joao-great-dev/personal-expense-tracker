import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Button, Card, DangerButton, ErrorBanner, Field, Input, Select } from "../ui";

type ExpenseRow = {
  expenseId: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
};

export function ExpensesPage() {
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDate, setEditDate] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.listCategories(),
  });

  const expensesQ = useQuery({
    queryKey: ["expenses", { from, to, categoryId }],
    queryFn: () =>
      api.listExpenses({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(categoryId ? { categoryId } : {}),
      }),
  });

  const categories = categoriesQ.data?.items ?? [];
  const expenses = (expensesQ.data?.items ?? []) as ExpenseRow[];

  const categoriesById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.categoryId, c.name);
    return m;
  }, [categories]);

  const createM = useMutation({
    mutationFn: (body: { amount: number; description: string; categoryId: string; date: string }) =>
      api.createExpense(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (expenseId: string) => api.deleteExpense(expenseId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const updateM = useMutation({
    mutationFn: (input: {
      expenseId: string;
      body: { amount: number; description: string; categoryId: string; date: string };
    }) => api.updateExpense(input.expenseId, input.body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      setEditingId(null);
    },
  });

  const startEdit = (e: ExpenseRow) => {
    setEditingId(e.expenseId);
    setEditAmount(String(e.amount));
    setEditDescription(e.description);
    setEditCategoryId(e.categoryId);
    setEditDate(e.date);
  };

  return (
    <div className="grid gap-4">
      <Card title="Add expense">
        <AddExpenseForm
          categories={categories}
          onSubmit={async (v) => {
            await createM.mutateAsync(v);
          }}
          error={createM.error instanceof Error ? createM.error.message : null}
          loading={createM.isPending}
        />
      </Card>

      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="From (YYYY-MM-DD)">
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-01-01" />
          </Field>
          <Field label="To (YYYY-MM-DD)">
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-12-31" />
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card title="Expenses">
        {expensesQ.error ? (
          <ErrorBanner message={expensesQ.error instanceof Error ? expensesQ.error.message : "Failed to load"} />
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-300">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Description</th>
                <th className="py-2">Category</th>
                <th className="py-2">Amount</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.expenseId} className="border-t border-slate-800">
                  <td className="py-2">
                    {editingId === e.expenseId ? (
                      <Input value={editDate} onChange={(ev) => setEditDate(ev.target.value)} />
                    ) : (
                      e.date
                    )}
                  </td>
                  <td className="py-2">
                    {editingId === e.expenseId ? (
                      <Input value={editDescription} onChange={(ev) => setEditDescription(ev.target.value)} />
                    ) : (
                      e.description
                    )}
                  </td>
                  <td className="py-2">
                    {editingId === e.expenseId ? (
                      <Select value={editCategoryId} onChange={(ev) => setEditCategoryId(ev.target.value)}>
                        {categories.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      categoriesById.get(e.categoryId) ?? e.categoryId
                    )}
                  </td>
                  <td className="py-2">
                    {editingId === e.expenseId ? (
                      <Input value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} />
                    ) : (
                      `$${e.amount.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === e.expenseId ? (
                        <>
                          <Button
                            disabled={updateM.isPending}
                            onClick={() =>
                              updateM.mutate({
                                expenseId: e.expenseId,
                                body: {
                                  amount: Number(editAmount),
                                  description: editDescription,
                                  categoryId: editCategoryId,
                                  date: editDate,
                                },
                              })
                            }
                          >
                            Save
                          </Button>
                          <Button className="bg-slate-700 text-slate-100 hover:bg-slate-600" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button className="bg-slate-700 text-slate-100 hover:bg-slate-600" onClick={() => startEdit(e)}>
                          Edit
                        </Button>
                      )}
                      <DangerButton
                        disabled={deleteM.isPending}
                        onClick={() => deleteM.mutate(e.expenseId)}
                      >
                        Delete
                      </DangerButton>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={5}>
                    No expenses found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AddExpenseForm({
  categories,
  onSubmit,
  error,
  loading,
}: {
  categories: Array<{ categoryId: string; name: string }>;
  onSubmit: (_v: { amount: number; description: string; categoryId: string; date: string }) => Promise<void>;
  error: string | null;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const parsedAmount = Number(amount);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  const canSubmit =
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 0 &&
    description.trim().length > 0 &&
    categoryId.trim().length > 0 &&
    date.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ amount: Number(amount), description, categoryId, date });
    setDescription("");
    setAmount("0");
  };

  return (
    <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
      {error ? (
        <div className="md:col-span-4">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      <Field label="Amount">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
      </Field>
      <Field label="Description">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Coffee" />
      </Field>
      <Field label="Category">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.length === 0 ? (
            <option value="" disabled>
              No categories available
            </option>
          ) : null}
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Date">
        <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
      </Field>
      <div className="md:col-span-4 flex justify-end">
        <Button disabled={loading || !canSubmit} type="submit">
          {loading ? "Adding..." : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

