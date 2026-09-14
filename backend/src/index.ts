import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT ?? 4000);
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`▲  FinanceFlow API listening on :${port}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM — shutting down");
    server.close(() => process.exit(0));
  });
}

export default app;
