export type UserItem = {
  email: string; // PK
  userId: string;
  passwordHash: string;
  createdAt: string;
};

export type CategoryItem = {
  userId: string; // PK
  categoryId: string; // SK
  name: string;
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseItem = {
  userId: string; // PK
  expenseId: string; // SK
  amount: number;
  description: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  gsi1pk: string; // userId
  gsi1sk: string; // date#expenseId
  createdAt: string;
  updatedAt: string;
};

