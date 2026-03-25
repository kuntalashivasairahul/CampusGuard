import { Router } from "express";
import { db, itemsTable, usersTable, claimsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import "../lib/session";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

router.get("/stats", requireAdmin, async (req, res) => {
  const [totalItems] = await db.select({ count: count() }).from(itemsTable);
  const [lostItems] = await db.select({ count: count() }).from(itemsTable).where(eq(itemsTable.type, "lost"));
  const [foundItems] = await db.select({ count: count() }).from(itemsTable).where(eq(itemsTable.type, "found"));
  const [returnedItems] = await db.select({ count: count() }).from(itemsTable).where(eq(itemsTable.status, "returned"));
  const [pendingClaims] = await db.select({ count: count() }).from(claimsTable).where(eq(claimsTable.status, "pending"));
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);

  return res.json({
    totalItems: totalItems.count,
    lostItems: lostItems.count,
    foundItems: foundItems.count,
    returnedItems: returnedItems.count,
    pendingClaims: pendingClaims.count,
    totalUsers: totalUsers.count,
  });
});

router.get("/items", requireAdmin, async (req, res) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const items = await db
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
    .orderBy(desc(itemsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ count: total }] = await db.select({ count: count() }).from(itemsTable);

  return res.json({
    items: items.map(item => ({
      ...item,
      imageUrl: item.imageUrl ?? null,
      createdAt: item.createdAt.toISOString(),
      claimCount: 0,
    })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/transactions", requireAdmin, async (req, res) => {
  const transactions = await db
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
    .orderBy(desc(claimsTable.createdAt));

  return res.json({
    transactions: transactions.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      verifiedAt: t.verifiedAt?.toISOString() ?? null,
    })),
    total: transactions.length,
  });
});

router.delete("/items/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(claimsTable).where(eq(claimsTable.itemId, id));
  await db.delete(itemsTable).where(eq(itemsTable.id, id));

  return res.json({ message: "Item deleted by admin" });
});

router.post("/claims/:id/flag", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.update(claimsTable).set({ flagged: true }).where(eq(claimsTable.id, id));
  return res.json({ message: "Claim flagged for review" });
});

export default router;
