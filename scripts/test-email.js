import mongoose from "mongoose";
import { connectDB } from "../backend/config/db.js";
import { User, Notification } from "../backend/models/index.js";
import {
  notify,
  deliverBatch,
  mailConfigured,
} from "../backend/services/notifications.js";
// Explicitly invoked setup test. It can send only to the configured administrator.
try {
  if (!mailConfigured()) throw new Error("SMTP is not configured.");
  await connectDB();
  const user = await User.findOne({
    email: process.env.ADMIN_EMAIL?.toLowerCase(),
    roles: "admin",
    demo: false,
  });
  if (!user) throw new Error("Run npm run setup:admin first.");
  const notification = await notify(
    user,
    "Publixia email setup verified",
    "Your Gmail SMTP connection is configured. This one-time setup test confirms that Publixia can submit notification emails. All notification categories use this same persistent delivery queue.",
    "/notifications",
    "system",
    "setup-email-verification-v1",
  );
  if (notification.email.state !== "sent") await deliverBatch();
  const updated = await Notification.findById(notification._id);
  console.log(
    JSON.stringify(
      {
        state: updated.email.state,
        sentAt: updated.email.sentAt,
        attempts: updated.email.attempts,
      },
      null,
      2,
    ),
  );
  if (updated.email.state !== "sent") process.exitCode = 1;
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
