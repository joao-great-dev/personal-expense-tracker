import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Button, Card, DangerButton, ErrorBanner, Field, Input } from "../ui";

export function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.listCategories(),
  });

  const createM = useMutation({
    mutationFn: (n: string) => api.createCategory({ name: n }),
    onSuccess: async () => {
      setName("");
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (categoryId: string) => api.deleteCategory(categoryId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const items = categoriesQ.data?.items ?? [];

  return (
    <div className="grid gap-4">
      <Card title="Add category">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate(name);
          }}
        >
          {createM.error ? (
            <div className="md:col-span-3">
              <ErrorBanner message={createM.error instanceof Error ? createM.error.message : "Failed"} />
            </div>
          ) : null}
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gym" />
          </Field>
          <div className="md:col-span-2 flex items-end justify-end">
            <Button disabled={createM.isPending || name.trim().length === 0} type="submit">
              {createM.isPending ? "Adding..." : "Add category"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Categories">
        {categoriesQ.error ? (
          <ErrorBanner message={categoriesQ.error instanceof Error ? categoriesQ.error.message : "Failed to load"} />
        ) : null}
        <div className="grid gap-2">
          {items.map((c) => (
            <div
              key={c.categoryId}
              className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2"
            >
              <div className="grid">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-slate-400">
                  {c.isPredefined ? "Predefined" : "Custom"}
                </span>
              </div>
              <DangerButton
                disabled={deleteM.isPending || c.isPredefined}
                title={c.isPredefined ? "Predefined categories can't be deleted" : "Delete category"}
                onClick={() => deleteM.mutate(c.categoryId)}
              >
                Delete
              </DangerButton>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="text-sm text-slate-400">No categories.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

