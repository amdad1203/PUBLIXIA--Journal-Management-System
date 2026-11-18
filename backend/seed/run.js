import mongoose from "mongoose";
import { connectDB, databaseError } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { seed } from "./data.js";
try {
  validateEnv();
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  await connectDB();
  console.log(
    "Connected. Adding synthetic demonstration records without deleting existing data.",
  );
  console.log(await seed());
} catch (e) {
  console.error(e.name?.includes("Mongo") ? databaseError(e) : e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
