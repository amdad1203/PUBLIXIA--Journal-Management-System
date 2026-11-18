import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { Notification, User } from "../models/index.js";
import { env } from "../config/env.js";
export const mailConfigured = () =>
  Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.from);
export const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let transport;
export function getTransport() {
  if (!mailConfigured()) return null;
  return (transport ||= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    requireTLS: !env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  }));
}
// The notification document IS the outbox: there is no second write that can lose an email job.
export async function notify(
  user,
  title,
  body,
  link = "/notifications",
  category = "system",
  eventKey = randomUUID(),
) {
  return Notification.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        user: user._id || user,
        title,
        body,
        link,
        category,
        eventKey,
        email: { state: "pending", attempts: 0, nextAttempt: new Date() },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
export async function deliverBatch({
  transport: injected,
  limit = 20,
  now = new Date(),
  jobIds,
} = {}) {
  const mailer = injected || getTransport();
  if (!mailer) return { processed: 0, configured: false };
  let processed = 0;
  for (; processed < limit; processed++) {
    const token = randomUUID();
    const job = await Notification.findOneAndUpdate(
      {
        ...(jobIds ? { _id: { $in: jobIds } } : {}),
        $or: [
          { "email.state": "pending", "email.nextAttempt": { $lte: now } },
          { "email.state": "processing", "email.leaseUntil": { $lt: now } },
        ],
      },
      {
        $set: {
          "email.state": "processing",
          "email.leaseUntil": new Date(now.getTime() + 120000),
          "email.leaseToken": token,
        },
        $inc: { "email.attempts": 1 },
      },
      { returnDocument: "after", sort: { createdAt: 1 } },
    );
    if (!job) break;
    const claim = { _id: job._id, "email.leaseToken": token };
    try {
      const user = await User.findById(job.user);
      const transactional = job.category === "account";
      if (
        !user ||
        !user.active ||
        user.demo ||
        (!transactional && (!user.emailNotifications || !user.emailVerified))
      ) {
        await Notification.updateOne(claim, {
          $set: {
            "email.state": "skipped",
            "email.lastError":
              "Recipient is demo, inactive, unverified, or opted out.",
          },
        });
        continue;
      }
      const link = new URL(
        job.link.startsWith("/") ? job.link : "/notifications",
        env.appUrl,
      ).href;
      const messageId = `<${job._id}@publixia.notifications>`;
      const info = await mailer.sendMail({
        from: env.smtp.from,
        to: user.email,
        messageId,
        subject: `Publixia · ${job.title}`,
        text: `${job.title}\n\n${job.body}\n\n${link}\n\nManage notifications in your Publixia settings.`,
        html: `<div style="font:16px Arial;max-width:600px;color:#172033"><h2 style="color:#09318d">PUBLIXIA</h2><h3>${escapeHTML(job.title)}</h3><p>${escapeHTML(job.body).replace(/\n/g, "<br>")}</p><p><a href="${escapeHTML(link)}">Open in Publixia</a></p><hr><p>Manage notification preferences in your Publixia settings.</p></div>`,
      });
      if (!info.accepted?.length) throw new Error("SMTP_REJECTED");
      await Notification.updateOne(claim, {
        $set: {
          "email.state": "sent",
          "email.sentAt": new Date(),
          "email.messageId": messageId,
          "email.lastError": "",
        },
      });
    } catch (e) {
      const exhausted = job.email.attempts >= 5;
      await Notification.updateOne(claim, {
        $set: {
          "email.state": exhausted ? "failed" : "pending",
          "email.lastError": `Email delivery failed (${String(
            e.code || "SMTP_ERROR",
          )
            .replace(/[^A-Z0-9_]/g, "")
            .slice(0, 40)}).`,
          "email.nextAttempt": new Date(
            now.getTime() + Math.min(3600000, 30000 * 2 ** job.email.attempts),
          ),
        },
      });
    }
  }
  return { processed, configured: true };
}
export function startEmailWorker() {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await deliverBatch();
    } catch {
      console.error("Email queue temporarily unavailable; it will retry.");
    } finally {
      busy = false;
    }
  };
  tick();
  const timer = setInterval(tick, 15000);
  timer.unref();
  return () => clearInterval(timer);
}
