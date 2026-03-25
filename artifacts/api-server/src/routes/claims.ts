import { Router } from "express";
import { db, claimsTable, itemsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { generateOtp } from "../lib/otp";
import "../lib/session";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/my", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const reportedItems = await db
    .select({
      id: itemsTable.id,
      type: itemsTable.type,
      title: itemsTable.title,
      description: itemsTable.description,
      category: itemsTable.category,
      location: itemsTable.location,
      imageUrl: itemsTable.imageUrl,
      status: itemsTable.status,
      reportedBy: itemsTable.reportedBy,
      reporterName: usersTable.name,
      reporterEmail: usersTable.email,
      createdAt: itemsTable.createdAt,
    })
    .from(itemsTable)
    .innerJoin(usersTable, eq(itemsTable.reportedBy, usersTable.id))
    .where(eq(itemsTable.reportedBy, userId))
    .orderBy(desc(itemsTable.createdAt));

  const myClaims = await db
    .select({
      id: claimsTable.id,
      itemId: claimsTable.itemId,
      itemTitle: itemsTable.title,
      itemType: itemsTable.type,
      claimerId: claimsTable.claimerId,
      claimerName: usersTable.name,
      claimerEmail: usersTable.email,
      status: claimsTable.status,
      message: claimsTable.message,
      flagged: claimsTable.flagged,
      createdAt: claimsTable.createdAt,
      verifiedAt: claimsTable.verifiedAt,
    })
    .from(claimsTable)
    .innerJoin(itemsTable, eq(claimsTable.itemId, itemsTable.id))
    .innerJoin(usersTable, eq(claimsTable.claimerId, usersTable.id))
    .where(eq(claimsTable.claimerId, userId))
    .orderBy(desc(claimsTable.createdAt));

  return res.json({
    reportedItems: reportedItems.map(item => ({
      ...item,
      imageUrl: item.imageUrl ?? null,
      createdAt: item.createdAt.toISOString(),
      claimCount: 0,
    })),
    claims: myClaims.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      verifiedAt: c.verifiedAt?.toISOString() ?? null,
    })),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { itemId, message } = req.body;
  const userId = req.session.userId!;

  if (!itemId || !message) {
    return res.status(400).json({ error: "itemId and message are required" });
  }

  const items = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId)).limit(1);
  if (items.length === 0) return res.status(404).json({ error: "Item not found" });

  const item = items[0];
  if (item.reportedBy === userId) {
    return res.status(400).json({ error: "You cannot claim your own item" });
  }

  if (item.status !== "active") {
    return res.status(400).json({ error: "This item is no longer available for claiming" });
  }

  const otp = generateOtp();
  const claims = await db.insert(claimsTable).values({
    itemId,
    claimerId: userId,
    message,
    otp,
    status: "pending",
    flagged: false,
  }).returning();

  await db.update(itemsTable).set({ status: "claimed" }).where(eq(itemsTable.id, itemId));

  const claim = claims[0];

  return res.status(201).json({
    id: claim.id,
    itemId: claim.itemId,
    claimerId: claim.claimerId,
    status: claim.status,
    otp: claim.otp,
    message: `Claim initiated! Share OTP ${otp} with the finder to confirm the return.`,
    createdAt: claim.createdAt.toISOString(),
  });
});

router.post("/:id/verify", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: "OTP is required" });

  const claims = await db.select().from(claimsTable).where(eq(claimsTable.id, id)).limit(1);
  if (claims.length === 0) return res.status(404).json({ error: "Claim not found" });

  const claim = claims[0];

  if (claim.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP. Please ask the owner to provide the correct code." });
  }

  if (claim.status === "verified") {
    return res.status(400).json({ error: "This claim has already been verified" });
  }

  await db.update(claimsTable).set({
    status: "verified",
    verifiedAt: new Date(),
  }).where(eq(claimsTable.id, id));

  await db.update(itemsTable).set({ status: "returned" }).where(eq(itemsTable.id, claim.itemId));

  return res.json({ message: "Item has been successfully returned! Transaction recorded." });
});

export default router;
