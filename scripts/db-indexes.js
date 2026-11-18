import mongoose from "mongoose";
import { connectDB, databaseError } from "../backend/config/db.js";
import * as models from "../backend/models/index.js";
try {
  await connectDB();
  for (const model of Object.values(models))
    if (model?.modelName) await model.createIndexes();
  console.log(
    "Application indexes created. Existing indexes and records were not removed.",
  );
} catch (e) {
  console.error(
    e.name?.includes("Mongo")
      ? databaseError(e)
      : "Index creation failed. Inspect the database for incompatible duplicate records.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
