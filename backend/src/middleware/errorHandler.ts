import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "ValidationError",
      message: "Invalid request payload",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Prisma known error shapes
  if (typeof err === "object" && err && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (code === "P2002") {
      res.status(409).json({ error: "Conflict", message: "Unique constraint failed" });
      return;
    }
    if (code === "P2025") {
      res.status(404).json({ error: "NotFound", message: "Record not found" });
      return;
    }
  }

  console.error("[errorHandler]", err);
  res.status(500).json({ error: "InternalServerError", message: "Something went wrong" });
};
