import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB, databaseError } from "../backend/config/db.js";
import { User } from "../backend/models/index.js";
import { validateEnv } from "../backend/config/env.js";
try {
  validateEnv();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const minimum = process.env.NODE_ENV === 'production' ? 16 : 5;
  if (!email || !email.includes("@") || !password || password.length < minimum)
    throw new Error(
      `Set ADMIN_EMAIL and ADMIN_PASSWORD (at least ${minimum} characters) in .env.`,
    );
  await connectDB();
  if (await User.exists({ email })) {
    console.log(
      "An account with ADMIN_EMAIL already exists. No password or permissions were changed.",
    );
  } else {
    await User.create({
      name: "Publixia Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      roles: ["admin", "researcher", "publisher"],
      emailVerified: true,
    });
    console.log(
      "Administrator created. Credentials are in your private setup file.",
    );
  }
} catch (e) {
  console.error(e.name?.includes("Mongo") ? databaseError(e) : e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
