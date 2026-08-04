import { z } from "zod";

export const subscriptionSchema = z.object({
  name: z.string().min(1).max(120),
  amount: z.number().positive(),
  billingCycle: z.enum(["monthly", "yearly", "weekly"]),
  nextRenewal: z.string().min(1),
  category: z.string().min(1),
  walletId: z.string().min(1),
  status: z.enum(["active", "paused", "cancelled"]),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
