import mongoose from "mongoose";
import { env } from "./env.js";
mongoose.set("bufferCommands", false);
export async function connectDB(uri = env.mongoUri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12000,
    connectTimeoutMS: 12000,
    maxPoolSize: 10,
    autoIndex: !env.production,
  });
  return mongoose.connection;
}
export function databaseError(error) {
  if (error.code === 18 || /auth|bad credentials/i.test(error.message))
    return "Atlas authentication failed. Check the database username and password.";
  if (/ENOTFOUND|querySrv|DNS/i.test(error.message))
    return "Atlas DNS lookup failed. Check the cluster hostname and DNS/network connection.";
  return "Cannot reach MongoDB. Check the Atlas IP access list, cluster availability and network connectivity.";
}
