import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { env } from "../config/env.js";
import { fail } from "../utils/http.js";
export async function auth(req, res, next) {
  const token = req.cookies?.publixia_session;
  if (!token) fail(401, "Please sign in to continue.");
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    fail(401, "Your session has expired. Please sign in again.");
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.active || user.tokenVersion !== payload.version)
    fail(401, "Session is no longer valid.");
  req.user = user;
  next();
}
export const hasRole = (user, ...roles) =>
  user.roles.some((r) => roles.includes(r));
export const allow =
  (...roles) =>
  (req, res, next) => {
    if (!hasRole(req.user, ...roles))
      fail(403, "You do not have permission for this action.");
    next();
  };
export function setSession(res, user) {
  const token = jwt.sign(
    { sub: String(user._id), version: user.tokenVersion },
    env.jwtSecret,
    { algorithm: "HS256", expiresIn: "8h" },
  );
  res.cookie("publixia_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.production,
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}
