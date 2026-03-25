import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createOtp, verifyOtp } from "../lib/otp";
import { sendOtpEmail } from "../lib/email";
import "../lib/session";

const router = Router();

const COLLEGE_EMAIL_DOMAINS = ["edu", "ac.in", "edu.in", "college.edu"];

function isCollegeEmail(email: string): boolean {
  const domain = email.split("@")[1] || "";
  return COLLEGE_EMAIL_DOMAINS.some(d => domain.endsWith(d)) || domain.includes("college") || domain.includes("university") || domain.includes("edu");
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!isCollegeEmail(email)) {
    return res.status(400).json({ error: "Please use your official college email address" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0 && existing[0].isVerified) {
    return res.status(400).json({ error: "Email already registered. Please login." });
  }

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: role as "student" | "faculty" | "admin",
      isAdmin: role === "admin",
      isVerified: false,
    });
  }

  const otp = await createOtp(email, "registration");
  await sendOtpEmail(email, otp, "registration");

  return res.json({ message: `OTP sent to ${email}. Please check your email. (Demo OTP: ${otp})` });
});

router.post("/verify-registration", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const valid = await verifyOtp(email, otp, "registration");
  if (!valid) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const users = await db.update(usersTable)
    .set({ isVerified: true })
    .where(eq(usersTable.email, email))
    .returning();

  const user = users[0];

  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Registration successful!",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (users.length === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = users[0];
  if (!user.isVerified) {
    return res.status(401).json({ error: "Please verify your email first" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const otp = await createOtp(email, "login");
  await sendOtpEmail(email, otp, "login");

  return res.json({ message: `OTP sent to ${email}. Please check your email. (Demo OTP: ${otp})` });
});

router.post("/verify-login", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const valid = await verifyOtp(email, otp, "login");
  if (!valid) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];

  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Login successful!",
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (users.length === 0) {
    return res.status(401).json({ error: "User not found" });
  }

  const user = users[0];
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
