/** Minimal shared types — expand when porting frontend domain models. */

export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  currency: string;
  role: Role;
  createdAt: string;
};
