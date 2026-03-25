import { Router } from "express";
import { db, itemsTable, usersTable, claimsTable } from "@workspace/db";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import "../lib/session";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/upload-image", (req, res) => {
  res.json({ error: "Use POST" });
});

router.post("/upload-image", requireAuth, async (req, res) => {
  const { imageData, mimeType } = req.body;

  if (!imageData || !mimeType) {
    return res.status(400).json({ error: "imageData and mimeType are required" });
  }

  const imageUrl = `data:${mimeType};base64,${imageData}`;
  return res.json({ imageUrl });
});

router.get("/", async (req, res) => {
  const { type, category, page = "1", limit = "10" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 10, 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (type && type !== "all") {
    conditions.push(eq(itemsTable.type, type as "lost" | "found"));
  }
  if (category) {
    conditions.push(eq(itemsTable.category, category));
  }

  const baseQuery = db
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
    .innerJoin(usersTable, eq(itemsTable.reportedBy, usersTable.id));

  const items = conditions.length > 0
    ? await baseQuery.where(and(...conditions)).orderBy(desc(itemsTable.createdAt)).limit(limitNum).offset(offset)
    : await baseQuery.orderBy(desc(itemsTable.createdAt)).limit(limitNum).offset(offset);

  const countResult = conditions.length > 0
    ? await db.select({ count: count() }).from(itemsTable).where(and(...conditions))
    : await db.select({ count: count() }).from(itemsTable);

  const total = countResult[0].count;

  const itemIds = items.map(i => i.id);
  const claimCounts = itemIds.length > 0
    ? await db.select({ itemId: claimsTable.itemId, cnt: count() }).from(claimsTable).where(inArray(claimsTable.itemId, itemIds)).groupBy(claimsTable.itemId)
    : [];

  const claimCountMap = new Map(claimCounts.map(c => [c.itemId, c.cnt]));

  return res.json({
    items: items.map(item => ({
      ...item,
      imageUrl: item.imageUrl ?? null,
      createdAt: item.createdAt.toISOString(),
      claimCount: claimCountMap.get(item.id) || 0,
    })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { type, title, description, category, location, imageUrl } = req.body;

  if (!type || !title || !description || !category || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const items = await db.insert(itemsTable).values({
    type: type as "lost" | "found",
    title,
    description,
    category,
    location,
    imageUrl: imageUrl || null,
    status: "active",
    reportedBy: req.session.userId!,
  }).returning();

  const item = items[0];
  const user = await db.select().from(usersTable).where(eq(usersTable.id, item.reportedBy)).limit(1);

  return res.status(201).json({
    ...item,
    reporterName: user[0]?.name || "",
    reporterEmail: user[0]?.email || "",
    createdAt: item.createdAt.toISOString(),
    claimCount: 0,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

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
    .where(eq(itemsTable.id, id))
    .limit(1);

  if (items.length === 0) return res.status(404).json({ error: "Item not found" });

  const claimCount = await db.select({ cnt: count() }).from(claimsTable).where(eq(claimsTable.itemId, id));

  return res.json({
    ...items[0],
    imageUrl: items[0].imageUrl ?? null,
    createdAt: items[0].createdAt.toISOString(),
    claimCount: claimCount[0].cnt,
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const items = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
  if (items.length === 0) return res.status(404).json({ error: "Item not found" });

  if (items[0].reportedBy !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(claimsTable).where(eq(claimsTable.itemId, id));
  await db.delete(itemsTable).where(eq(itemsTable.id, id));

  return res.json({ message: "Item deleted successfully" });
});

export default router;
