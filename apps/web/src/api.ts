import { getEnv } from "./env";
import { useAuthStore } from "./authStore";
import type {
  CreateCategoryRequest,
  CreateExpenseRequest,
  LoginRequest,
  SignupRequest,
  UpdateCategoryRequest,
  UpdateExpenseRequest,
} from "@pet/shared";

export type ApiError = { message: string; details?: unknown };

const baseUrl = () => getEnv().VITE_API_BASE_URL.replace(/\/+$/, "");

async function request<T>(input: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
  auth?: boolean;
}): Promise<T> {
  const qs = input.query
    ? `?${new URLSearchParams(
        Object.entries(input.query).flatMap(([k, v]) => (v !== undefined && v !== "" ? [[k, v]] : [])),
      ).toString()}`
    : "";

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (input.auth) {
    const token = useAuthStore.getState().accessToken;
    if (!token) throw new Error("Not authenticated");
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl()}${input.path}${qs}`, {
    method: input.method,
    headers,
    body: input.body !== undefined ? JSON.stringify(input.body) : null,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  signup: (body: SignupRequest) =>
    request<{ userId: string; email: string; accessToken: string; exp: number }>({
      method: "POST",
      path: "/auth/signup",
      body,
    }),
  login: (body: LoginRequest) =>
    request<{ userId: string; email: string; accessToken: string; exp: number }>({
      method: "POST",
      path: "/auth/login",
      body,
    }),

  listCategories: () =>
    request<{ items: Array<{ categoryId: string; name: string; isPredefined: boolean }> }>({
      method: "GET",
      path: "/categories",
      auth: true,
    }),
  createCategory: (body: CreateCategoryRequest) =>
    request<{ item: { categoryId: string; name: string; isPredefined: boolean } }>({
      method: "POST",
      path: "/categories",
      auth: true,
      body,
    }),
  updateCategory: (categoryId: string, body: UpdateCategoryRequest) =>
    request<{ item: { categoryId: string; name: string; isPredefined: boolean } }>({
      method: "PATCH",
      path: `/categories/${categoryId}`,
      auth: true,
      body,
    }),
  deleteCategory: (categoryId: string) =>
    request<void>({
      method: "DELETE",
      path: `/categories/${categoryId}`,
      auth: true,
    }),

  listExpenses: (query?: { from?: string; to?: string; categoryId?: string }) =>
    request<{ items: Array<{ expenseId: string; amount: number; description: string; categoryId: string; date: string }> }>({
      method: "GET",
      path: "/expenses",
      auth: true,
      ...(query ? { query } : {}),
    }),
  createExpense: (body: CreateExpenseRequest) =>
    request<{ item: { expenseId: string } }>({
      method: "POST",
      path: "/expenses",
      auth: true,
      body,
    }),
  updateExpense: (expenseId: string, body: UpdateExpenseRequest) =>
    request<{ item: { expenseId: string } }>({
      method: "PATCH",
      path: `/expenses/${expenseId}`,
      auth: true,
      body,
    }),
  deleteExpense: (expenseId: string) =>
    request<void>({
      method: "DELETE",
      path: `/expenses/${expenseId}`,
      auth: true,
    }),

  reportByMonth: (query?: { from?: string; to?: string }) =>
    request<{ items: Array<{ month: string; total: number }> }>({
      method: "GET",
      path: "/reports/by-month",
      auth: true,
      ...(query ? { query } : {}),
    }),
  reportByCategory: (query?: { from?: string; to?: string }) =>
    request<{ items: Array<{ categoryId: string; total: number }> }>({
      method: "GET",
      path: "/reports/by-category",
      auth: true,
      ...(query ? { query } : {}),
    }),
};

