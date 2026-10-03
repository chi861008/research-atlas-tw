import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { bookmarks } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function owner() {
  const user = await getChatGPTUser();
  return user?.userId || null;
}

export async function GET() {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ signedIn: false, bookmarks: [] });
  const rows = await getDb().select().from(bookmarks).where(eq(bookmarks.ownerId, ownerId)).orderBy(desc(bookmarks.createdAt)).limit(250);
  return Response.json({ signedIn: true, bookmarks: rows.map((row) => JSON.parse(row.payload)) });
}

export async function PUT(request: Request) {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const payload = await request.json() as { key?: string; [key: string]: unknown };
  const paperKey = String(payload.key || "").slice(0, 500);
  if (!paperKey) return Response.json({ error: "key is required" }, { status: 400 });
  const serialized = JSON.stringify(payload);
  if (serialized.length > 50_000) return Response.json({ error: "bookmark is too large" }, { status: 413 });
  await getDb().insert(bookmarks).values({ ownerId, paperKey, payload: serialized })
    .onConflictDoUpdate({ target: [bookmarks.ownerId, bookmarks.paperKey], set: { payload: serialized } });
  return Response.json({ saved: true });
}

export async function DELETE(request: Request) {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key") || "";
  await getDb().delete(bookmarks).where(and(eq(bookmarks.ownerId, ownerId), eq(bookmarks.paperKey, key)));
  return Response.json({ deleted: true });
}
