import { z } from "zod";

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  targetAmount: z.number().positive("Target must be positive"),
  deadline: z.string().optional(),
  icon: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

export const contributionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  note: z.string().max(200).optional(),
});

export type ContributionFormValues = z.infer<typeof contributionSchema>;
