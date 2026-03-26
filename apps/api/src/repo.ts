import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getEnv } from "./env";
import { createDocClient } from "./db";
import type { CategoryItem, ExpenseItem, UserItem } from "./models";
import { predefinedCategoryNames } from "./predefinedCategories";

const nowIso = () => new Date().toISOString();
const useInMemoryStore =
  process.env.IS_OFFLINE === "true" && !process.env.DYNAMODB_ENDPOINT;

const memUsers = new Map<string, UserItem>();
const memCategories = new Map<string, Map<string, CategoryItem>>();
const memExpenses = new Map<string, Map<string, ExpenseItem>>();

function ensureLocalSeedCategories(userId: string) {
  if (!useInMemoryStore) return;
  const byUser = memCategories.get(userId) ?? new Map<string, CategoryItem>();
  if (byUser.size > 0) {
    memCategories.set(userId, byUser);
    return;
  }
  const createdAt = nowIso();
  for (const name of predefinedCategoryNames) {
    const categoryId = newCategoryId();
    byUser.set(categoryId, {
      userId,
      categoryId,
      name,
      isPredefined: true,
      createdAt,
      updatedAt: createdAt,
    });
  }
  memCategories.set(userId, byUser);
}

export function newCategoryId() {
  return `cat_${nanoid(16)}`;
}

export function newExpenseId() {
  return `exp_${nanoid(16)}`;
}

export async function getUserByEmail(email: string): Promise<UserItem | null> {
  if (useInMemoryStore) {
    return memUsers.get(email) ?? null;
  }
  const env = getEnv();
  const db = createDocClient();
  const res = await db.send(
    new GetCommand({
      TableName: env.USERS_TABLE,
      Key: { email },
    }),
  );
  return (res.Item as UserItem | undefined) ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
  userId: string;
}): Promise<UserItem> {
  if (useInMemoryStore) {
    if (memUsers.has(input.email)) {
      throw new Error("Email already exists");
    }
    const item: UserItem = {
      email: input.email,
      userId: input.userId,
      passwordHash: await bcrypt.hash(input.password, 12),
      createdAt: nowIso(),
    };
    memUsers.set(input.email, item);
    return item;
  }
  const env = getEnv();
  const db = createDocClient();

  const item: UserItem = {
    email: input.email,
    userId: input.userId,
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: nowIso(),
  };

  await db.send(
    new PutCommand({
      TableName: env.USERS_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(email)",
    }),
  );

  return item;
}

export async function verifyUserPassword(input: {
  email: string;
  password: string;
}): Promise<UserItem | null> {
  const user = await getUserByEmail(input.email);
  if (!user) return null;
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  return ok ? user : null;
}

export async function ensurePredefinedCategories(userId: string) {
  if (useInMemoryStore) {
    ensureLocalSeedCategories(userId);
    return;
  }
  const env = getEnv();
  const db = createDocClient();
  const createdAt = nowIso();
  await Promise.all(
    predefinedCategoryNames.map(async (name) => {
      const categoryId = newCategoryId();
      const item: CategoryItem = {
        userId,
        categoryId,
        name,
        isPredefined: true,
        createdAt,
        updatedAt: createdAt,
      };
      try {
        await db.send(
          new PutCommand({
            TableName: env.CATEGORIES_TABLE,
            Item: item,
            ConditionExpression: "attribute_not_exists(userId) AND attribute_not_exists(categoryId)",
          }),
        );
      } catch {
        // best-effort
      }
    }),
  );
}

export async function listCategories(userId: string): Promise<CategoryItem[]> {
  if (useInMemoryStore) {
    ensureLocalSeedCategories(userId);
    return Array.from(memCategories.get(userId)?.values() ?? []);
  }
  const env = getEnv();
  const db = createDocClient();
  const res = await db.send(
    new QueryCommand({
      TableName: env.CATEGORIES_TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    }),
  );
  return (res.Items as CategoryItem[] | undefined) ?? [];
}

export async function createCategory(input: {
  userId: string;
  name: string;
}): Promise<CategoryItem> {
  if (useInMemoryStore) {
    const byUser = memCategories.get(input.userId) ?? new Map<string, CategoryItem>();
    const ts = nowIso();
    const item: CategoryItem = {
      userId: input.userId,
      categoryId: newCategoryId(),
      name: input.name,
      isPredefined: false,
      createdAt: ts,
      updatedAt: ts,
    };
    byUser.set(item.categoryId, item);
    memCategories.set(input.userId, byUser);
    return item;
  }
  const env = getEnv();
  const db = createDocClient();
  const ts = nowIso();
  const item: CategoryItem = {
    userId: input.userId,
    categoryId: newCategoryId(),
    name: input.name,
    isPredefined: false,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.send(
    new PutCommand({
      TableName: env.CATEGORIES_TABLE,
      Item: item,
    }),
  );
  return item;
}

export async function updateCategory(input: {
  userId: string;
  categoryId: string;
  name: string;
}): Promise<CategoryItem | null> {
  if (useInMemoryStore) {
    const byUser = memCategories.get(input.userId);
    if (!byUser) return null;
    const existing = byUser.get(input.categoryId);
    if (!existing) return null;
    const updated: CategoryItem = {
      ...existing,
      name: input.name,
      updatedAt: nowIso(),
    };
    byUser.set(input.categoryId, updated);
    return updated;
  }
  const env = getEnv();
  const db = createDocClient();
  const res = await db.send(
    new UpdateCommand({
      TableName: env.CATEGORIES_TABLE,
      Key: { userId: input.userId, categoryId: input.categoryId },
      UpdateExpression: "SET #name = :n, updatedAt = :u",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":n": input.name, ":u": nowIso() },
      ConditionExpression: "attribute_exists(userId) AND attribute_exists(categoryId)",
      ReturnValues: "ALL_NEW",
    }),
  );
  return (res.Attributes as CategoryItem | undefined) ?? null;
}

export async function deleteCategory(input: {
  userId: string;
  categoryId: string;
}) {
  if (useInMemoryStore) {
    memCategories.get(input.userId)?.delete(input.categoryId);
    return;
  }
  const env = getEnv();
  const db = createDocClient();
  await db.send(
    new DeleteCommand({
      TableName: env.CATEGORIES_TABLE,
      Key: { userId: input.userId, categoryId: input.categoryId },
    }),
  );
}

export async function listExpenses(input: {
  userId: string;
  from?: string;
  to?: string;
  categoryId?: string;
}): Promise<ExpenseItem[]> {
  if (useInMemoryStore) {
    const from = input.from ?? "0000-01-01";
    const to = input.to ?? "9999-12-31";
    const items = Array.from(memExpenses.get(input.userId)?.values() ?? []).filter(
      (e) => e.date >= from && e.date <= to,
    );
    return input.categoryId
      ? items.filter((e) => e.categoryId === input.categoryId)
      : items.sort((a, b) => a.date.localeCompare(b.date));
  }
  const env = getEnv();
  const db = createDocClient();

  const from = input.from ?? "0000-01-01";
  const to = input.to ?? "9999-12-31";
  const start = `${from}#`;
  const end = `${to}#\uffff`;

  const res = await db.send(
    new QueryCommand({
      TableName: env.EXPENSES_TABLE,
      IndexName: env.EXPENSES_GSI1,
      KeyConditionExpression: "gsi1pk = :u AND gsi1sk BETWEEN :a AND :b",
      ExpressionAttributeValues: { ":u": input.userId, ":a": start, ":b": end },
    }),
  );
  const items = (res.Items as ExpenseItem[] | undefined) ?? [];
  return input.categoryId
    ? items.filter((e) => e.categoryId === input.categoryId)
    : items;
}

export async function createExpense(input: {
  userId: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}): Promise<ExpenseItem> {
  if (useInMemoryStore) {
    ensureLocalSeedCategories(input.userId);
    const byUser = memExpenses.get(input.userId) ?? new Map<string, ExpenseItem>();
    const ts = nowIso();
    const expenseId = newExpenseId();
    const item: ExpenseItem = {
      userId: input.userId,
      expenseId,
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      date: input.date,
      gsi1pk: input.userId,
      gsi1sk: `${input.date}#${expenseId}`,
      createdAt: ts,
      updatedAt: ts,
    };
    byUser.set(expenseId, item);
    memExpenses.set(input.userId, byUser);
    return item;
  }
  const env = getEnv();
  const db = createDocClient();
  const ts = nowIso();
  const expenseId = newExpenseId();
  const item: ExpenseItem = {
    userId: input.userId,
    expenseId,
    amount: input.amount,
    description: input.description,
    categoryId: input.categoryId,
    date: input.date,
    gsi1pk: input.userId,
    gsi1sk: `${input.date}#${expenseId}`,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.send(
    new PutCommand({
      TableName: env.EXPENSES_TABLE,
      Item: item,
    }),
  );
  return item;
}

export async function updateExpense(input: {
  userId: string;
  expenseId: string;
  patch: Partial<Pick<ExpenseItem, "amount" | "description" | "categoryId" | "date">>;
}): Promise<ExpenseItem | null> {
  if (useInMemoryStore) {
    const byUser = memExpenses.get(input.userId);
    if (!byUser) return null;
    const existing = byUser.get(input.expenseId);
    if (!existing) return null;
    const date = input.patch.date ?? existing.date;
    const updated: ExpenseItem = {
      ...existing,
      ...input.patch,
      date,
      gsi1pk: input.userId,
      gsi1sk: `${date}#${input.expenseId}`,
      updatedAt: nowIso(),
    };
    byUser.set(input.expenseId, updated);
    return updated;
  }
  const env = getEnv();
  const db = createDocClient();
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":u": nowIso() };
  const sets: string[] = ["updatedAt = :u"];

  const add = (field: keyof ExpenseItem, value: unknown) => {
    const key = `#${field}`;
    const val = `:${field}`;
    names[key] = field;
    values[val] = value;
    sets.push(`${key} = ${val}`);
  };

  if (typeof input.patch.amount === "number") add("amount", input.patch.amount);
  if (typeof input.patch.description === "string") add("description", input.patch.description);
  if (typeof input.patch.categoryId === "string") add("categoryId", input.patch.categoryId);
  if (typeof input.patch.date === "string") {
    add("date", input.patch.date);
    add("gsi1pk", input.userId);
    add("gsi1sk", `${input.patch.date}#${input.expenseId}`);
  }

  const res = await db.send(
    new UpdateCommand({
      TableName: env.EXPENSES_TABLE,
      Key: { userId: input.userId, expenseId: input.expenseId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ConditionExpression: "attribute_exists(userId) AND attribute_exists(expenseId)",
      ReturnValues: "ALL_NEW",
    }),
  );
  return (res.Attributes as ExpenseItem | undefined) ?? null;
}

export async function deleteExpense(input: { userId: string; expenseId: string }) {
  if (useInMemoryStore) {
    memExpenses.get(input.userId)?.delete(input.expenseId);
    return;
  }
  const env = getEnv();
  const db = createDocClient();
  await db.send(
    new DeleteCommand({
      TableName: env.EXPENSES_TABLE,
      Key: { userId: input.userId, expenseId: input.expenseId },
    }),
  );
}

