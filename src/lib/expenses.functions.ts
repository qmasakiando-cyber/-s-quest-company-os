import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listExpensesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listExpenses } = await import("./expenses.server");
  return listExpenses();
});

const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  amount: z.number().positive(),
  transactionDate: z.string().min(1),
  memo: z.string().max(500).nullable(),
});

export const createExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createExpenseSchema.parse(data))
  .handler(async ({ data }) => {
    const { createExpense } = await import("./expenses.server");
    return createExpense(data);
  });
