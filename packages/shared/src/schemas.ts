import { z } from "zod";

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).max(72);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const currencyAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(1_000_000);

export const categoryNameSchema = z.string().trim().min(1).max(40);
export const expenseDescriptionSchema = z.string().trim().min(1).max(140);

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const createCategoryRequestSchema = z.object({
  name: categoryNameSchema,
});

export const updateCategoryRequestSchema = z.object({
  name: categoryNameSchema,
});

export const createExpenseRequestSchema = z.object({
  amount: currencyAmountSchema,
  description: expenseDescriptionSchema,
  categoryId: z.string().min(1),
  date: isoDateSchema,
});

export const updateExpenseRequestSchema = z.object({
  amount: currencyAmountSchema.optional(),
  description: expenseDescriptionSchema.optional(),
  categoryId: z.string().min(1).optional(),
  date: isoDateSchema.optional(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type CreateExpenseRequest = z.infer<typeof createExpenseRequestSchema>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequestSchema>;

