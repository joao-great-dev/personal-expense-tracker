export type Id = string;

export type User = {
  userId: Id;
  email: string;
  createdAt: string;
};

export type Category = {
  categoryId: Id;
  userId: Id;
  name: string;
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  expenseId: Id;
  userId: Id;
  amount: number;
  description: string;
  categoryId: Id;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
};

