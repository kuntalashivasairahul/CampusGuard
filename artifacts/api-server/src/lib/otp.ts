import { db, otpsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(email: string, type: "registration" | "login"): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpsTable).values({
    email,
    code,
    type,
    used: false,
    expiresAt,
  });

  return code;
}

export async function verifyOtp(email: string, code: string, type: "registration" | "login"): Promise<boolean> {
  const now = new Date();
  const otpRecords = await db
    .select()
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.code, code),
        eq(otpsTable.type, type),
        eq(otpsTable.used, false),
        gt(otpsTable.expiresAt, now),
      ),
    )
    .limit(1);

  if (otpRecords.length === 0) return false;

  await db
    .update(otpsTable)
    .set({ used: true })
    .where(eq(otpsTable.id, otpRecords[0].id));

  return true;
}
