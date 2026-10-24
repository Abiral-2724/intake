import cron from "node-cron";
import client from "../prisma.js";
export async function pingDatabase() {
  try {
    await client.$queryRaw`SELECT 1`;
    console.log(`[db-keep-alive] OK at ${new Date().toISOString()}`);
    return true;
  } catch (e) {
    console.error("[db-keep-alive] failed:", e.message);
    return false;
  }
}

export function startDbKeepAlive() {
  // Every day at 12:00 PM IST
  cron.schedule("0 12 * * *", pingDatabase, { timezone: "Asia/Kolkata" });

  // Ping once at startup too
  pingDatabase();
}