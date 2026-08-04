import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  type: z.enum(["bank", "cash", "credit", "savings"]),
  balance: z.number().nonnegative("Balance can't be negative"),
  currency: z.string().min(1).max(8).default("PKR"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  icon: z.string().min(1),
});

export type WalletFormValues = z.infer<typeof walletSchema>;
