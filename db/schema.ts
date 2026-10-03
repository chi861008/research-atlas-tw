import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(),
  body: text("body").notNull(),
  expiresAt: integer("expires_at").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bookmarks = sqliteTable("bookmarks", {
  ownerId: text("owner_id").notNull(),
  paperKey: text("paper_key").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.ownerId, table.paperKey] })]);

export const researchProjects = sqliteTable("research_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  query: text("query").notNull(),
  settings: text("settings").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_research_projects_owner_updated").on(table.ownerId, table.updatedAt)]);
