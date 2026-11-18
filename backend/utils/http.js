import { z } from "zod";
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const fail = (status, message, code) => {
  throw new HttpError(status, message, code);
};
export const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record ID");
export const text = (max = 5000, min = 1) =>
  z.string().trim().min(min).max(max);
export const date = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .optional();
export function parse(schema, req) {
  return schema.parse(req.body);
}
export function page(req) {
  return {
    limit: Math.min(100, Math.max(1, Number(req.query.limit) || 30)),
    skip:
      Math.max(0, (Number(req.query.page) || 1) - 1) *
      Math.min(100, Math.max(1, Number(req.query.limit) || 30)),
  };
}
export function search(q) {
  return new RegExp(
    String(q || "")
      .slice(0, 150)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );
}
export const same = (a, b) => String(a?._id || a) === String(b?._id || b);
export const safeUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  roles: u.roles,
  academicStatus: u.academicStatus,
  affiliation: u.affiliation,
  bio: u.bio,
  interests: u.interests,
  reviewerAvailable: u.reviewerAvailable,
  reviewerCapacity: u.reviewerCapacity,
  active: u.active,
  emailNotifications: u.emailNotifications,
  emailVerified: u.emailVerified,
  demo: u.demo,
});
