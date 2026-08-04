import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Banknote,
  Briefcase,
  Building2,
  TrendingUp,
  Gift,
  Repeat,
  type LucideIcon,
} from "lucide-react";

interface CategoryDef {
  label: string;
  icon: LucideIcon;
  tone: "expense" | "income" | "neutral";
  color: string;
}

export const CATEGORIES: Record<string, CategoryDef> = {
  Food: { label: "Food", icon: Utensils, tone: "expense", color: "#C9A961" },
  Transport: { label: "Transport", icon: Car, tone: "expense", color: "#5FAA7E" },
  Shopping: { label: "Shopping", icon: ShoppingBag, tone: "expense", color: "#D97757" },
  Bills: { label: "Bills", icon: Receipt, tone: "expense", color: "#8B92BD" },
  Entertainment: { label: "Entertainment", icon: Film, tone: "expense", color: "#A881D9" },
  Health: { label: "Health", icon: HeartPulse, tone: "expense", color: "#BD5F5F" },
  Education: { label: "Education", icon: GraduationCap, tone: "expense", color: "#8B6F2F" },
  Salary: { label: "Salary", icon: Banknote, tone: "income", color: "#5FAA7E" },
  Freelance: { label: "Freelance", icon: Briefcase, tone: "income", color: "#2F6E4F" },
  Business: { label: "Business", icon: Building2, tone: "income", color: "#5F95BD" },
  Investment: { label: "Investment", icon: TrendingUp, tone: "income", color: "#0F6EBD" },
  Gift: { label: "Gift", icon: Gift, tone: "income", color: "#D9A2BD" },
  Other: { label: "Other", icon: Sparkles, tone: "neutral", color: "#8B928E" },
  Transfer: { label: "Transfer", icon: Repeat, tone: "neutral", color: "#C9A961" },
};

export function categoryFor(name: string): CategoryDef {
  return CATEGORIES[name] ?? CATEGORIES["Other"]!;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other",
] as const;

export const SUBSCRIPTION_CATEGORIES = [...EXPENSE_CATEGORIES] as unknown as string[];
