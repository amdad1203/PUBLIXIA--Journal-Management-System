import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { User, AuthToken } from "../models/index.js";
import { auth, setSession } from "../middleware/auth.js";
import { text, parse, fail, safeUser } from "../utils/http.js";
import { notify } from "../services/notifications.js";
import { env } from "../config/env.js";
export const authRouter = Router();
const limited = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const password = z.string().min(10).max(128);
const hash = (v) => createHash("sha256").update(v).digest("hex");
async function issueToken(user, kind) {
  const token = randomBytes(32).toString("hex");
  await AuthToken.deleteMany({ user: user._id, kind });
  await AuthToken.create({
    user: user._id,
    kind,
    hash: hash(token),
    expiresAt: new Date(Date.now() + (kind === "verify" ? 86400000 : 3600000)),
  });
  await notify(
    user,
    kind === "verify" ? "Verify your email address" : "Reset your password",
    kind === "verify"
      ? "Confirm your email to receive research and publishing notifications."
      : "Use this link within one hour to choose a new password.",
    `/${kind === "verify" ? "verify-email" : "reset-password"}?token=${token}`,
    "account",
  );
}
authRouter.post("/register", limited, async (req, res) => {
  const b = parse(
    z.object({
      name: text(100),
      email,
      password,
      academicStatus: z.enum(['undergraduate','postgraduate','independent_researcher','faculty','academic_author','other']).optional(),
      affiliation: text(200, 0).optional(),
    }),
    req,
  );
  if (await User.exists({ email: b.email }))
    fail(409, "This email is already registered.");
  const user = await User.create({
    ...b,
    passwordHash: await bcrypt.hash(b.password, 12),
  });
  await issueToken(user, "verify");
  setSession(res, user);
  res.status(201).json({ user: safeUser(user) });
});
authRouter.post("/login", limited, async (req, res) => {
  const b = parse(z.object({ email, password: z.string().max(128) }), req);
  const user = await User.findOne({ email: b.email }).select("+passwordHash");
  if (
    !user ||
    !user.active ||
    (user.demo && env.production) ||
    !(await bcrypt.compare(b.password, user.passwordHash))
  )
    fail(401, "Email or password is incorrect.");
  setSession(res, user);
  res.json({ user: safeUser(user) });
});
authRouter.post("/logout", auth, async (req, res) => {
  res.clearCookie("publixia_session", { path: "/" });
  res.json({ ok: true });
});
authRouter.get("/me", auth, (req, res) =>
  res.json({ user: safeUser(req.user) }),
);
authRouter.patch("/me", auth, async (req, res) => {
  const b = parse(
    z.object({
      name: text(100).optional(),
      academicStatus: z.enum(['undergraduate','postgraduate','independent_researcher','faculty','academic_author','other']).optional(),
      affiliation: text(200, 0).optional(),
      bio: text(2000, 0).optional(),
      interests: text(500, 0).optional(),
      reviewerAvailable: z.boolean().optional(),
      reviewerCapacity: z.number().int().min(1).max(20).optional(),
      emailNotifications: z.boolean().optional(),
    }),
    req,
  );
  Object.assign(req.user, b);
  await req.user.save();
  res.json({ user: safeUser(req.user) });
});
authRouter.post("/forgot-password", limited, async (req, res) => {
  const b = parse(z.object({ email }), req);
  const u = await User.findOne({ email: b.email, active: true, demo: false });
  if (u) await issueToken(u, "reset");
  res.json({
    message: "If this account exists, a reset email has been queued.",
  });
});
authRouter.post("/resend-verification", limited, auth, async (req, res) => {
  if (!req.user.emailVerified) await issueToken(req.user, "verify");
  res.json({ message: "Verification email queued." });
});
authRouter.post("/verify-email", limited, async (req, res) => {
  const { token } = parse(z.object({ token: z.string().length(64) }), req);
  const found = await AuthToken.findOneAndDelete({
    hash: hash(token),
    kind: "verify",
    expiresAt: { $gt: new Date() },
  });
  if (!found)
    fail(400, "The verification link has expired or was already used.");
  await User.updateOne({ _id: found.user }, { $set: { emailVerified: true } });
  res.json({
    message: "Email verified. You can now receive notification emails.",
  });
});
authRouter.post("/reset-password", limited, async (req, res) => {
  const b = parse(z.object({ token: z.string().length(64), password }), req);
  const found = await AuthToken.findOneAndDelete({
    hash: hash(b.token),
    kind: "reset",
    expiresAt: { $gt: new Date() },
  });
  if (!found) fail(400, "The reset link has expired or was already used.");
  await User.updateOne(
    { _id: found.user },
    {
      $set: { passwordHash: await bcrypt.hash(b.password, 12) },
      $inc: { tokenVersion: 1 },
    },
  );
  res.json({ message: "Password updated. Please sign in." });
});
