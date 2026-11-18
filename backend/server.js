import mongoose from "mongoose";
import { env, validateEnv } from "./config/env.js";
import { connectDB, databaseError } from "./config/db.js";
import { createApp } from "./app.js";
import { startEmailWorker } from "./services/notifications.js";
import { startReminders } from "./jobs/reminders.js";
try {
  validateEnv();
  await connectDB();
} catch (e) {
  console.error(e.name?.includes("Mongo") ? databaseError(e) : e.message);
  process.exit(1);
}
const app = createApp();
const PORT = process.env.PORT || env.port;

const server = app.listen(PORT, "0.0.0.0", () =>
  console.log(`Publixia API running on 0.0.0.0:${PORT} · MongoDB connected`),
);
const stopMail =
  process.env.EMAIL_WORKER_ENABLED === "false" ? () => {} : startEmailWorker();
const stopReminders = startReminders();
async function close() {
  stopMail();
  stopReminders();
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGINT", close);
process.on("SIGTERM", close);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PUBLIXIA API is running",
    database: mongoose.connection.readyState === 1
      ? "Connected"
      : "Disconnected"
  });
});