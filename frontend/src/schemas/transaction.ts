import { z } from "zod";

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Pick a wallet"),
    toWalletId: z.string().optional(),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.number().positive("Amount must be positive"),
    category: z.string().min(1, "Pick a category"),
    description: z.string().max(280).optional(),
    date: z.string().min(1, "Date is required"),
    tagInput: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.toWalletId || data.toWalletId.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick destination wallet",
          path: ["toWalletId"],
        });
      } else if (data.toWalletId === data.walletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wallets must differ",
          path: ["toWalletId"],
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
