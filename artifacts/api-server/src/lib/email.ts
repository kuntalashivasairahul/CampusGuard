import { logger } from "./logger";

export async function sendOtpEmail(email: string, otp: string, type: "registration" | "login"): Promise<void> {
  const subject = type === "registration"
    ? "College Lost & Found - Verify Your Registration"
    : "College Lost & Found - Your Login OTP";

  const body = type === "registration"
    ? `Welcome to College Lost & Found!\n\nYour verification OTP is: ${otp}\n\nThis OTP expires in 10 minutes.`
    : `Your login OTP is: ${otp}\n\nThis OTP expires in 10 minutes. Do not share it with anyone.`;

  logger.info({ email, type, otp }, `[EMAIL SIMULATION] Sending OTP email: ${subject}\n${body}`);
}
