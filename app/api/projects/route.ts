import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { researchProjects } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function owner() {
  const user = await getChatGPTUser();
  return user?.userId || null;
}

export async function GET() {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ signedIn: false, projects: [] });
  const projects = await getDb().select().from(researchProjects).where(eq(researchProjects.ownerId, ownerId)).orderBy(desc(researchProjects.updatedAt)).limit(50);
  return Response.json({ signedIn: true, projects });
}

export async function POST(request: Request) {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json() as { title?: string; query?: string; settings?: unknown };
  const title = String(body.title || body.query || "未命名研究").trim().slice(0, 160);
  const query = String(body.query || "").trim().slice(0, 500);
  if (!query) return Response.json({ error: "query is required" }, { status: 400 });
  const settings = JSON.stringify(body.settings || {});
  if (settings.length > 10_000) return Response.json({ error: "settings are too large" }, { status: 413 });
  const [project] = await getDb().insert(researchProjects).values({ ownerId, title, query, settings }).returning();
  return Response.json({ project }, { status: 201 });
}

export async function DELETE(request: Request) {
  const ownerId = await owner();
  if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "valid id is required" }, { status: 400 });
  await getDb().delete(researchProjects).where(and(eq(researchProjects.ownerId, ownerId), eq(researchProjects.id, id)));
  return Response.json({ deleted: true });
}
