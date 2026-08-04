import { z } from "zod";

export const loanSchema = z.object({
  name: z.string().min(1).max(120),
  principalAmount: z.number().nonnegative(),
  remainingBalance: z.number().nonnegative(),
  interestRate: z.number().min(0).max(100),
  emiAmount: z.number().positive(),
  nextDueDate: z.string().min(1),
  lenderName: z.string().min(1).max(120),
  type: z.enum(["given", "taken"]),
});

export type LoanFormValues = z.infer<typeof loanSchema>;
