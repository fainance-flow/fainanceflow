import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`▲  FinanceFlow API listening on :${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM — shutting down");
  server.close(() => process.exit(0));
});
