import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const servicePopularityDaily = sqliteTable("service_popularity_daily", {
  day: text("day").notNull(),
  serviceId: text("service_id").notNull(),
  searchClicks: integer("search_clicks").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.day, table.serviceId] }),
  index("idx_service_popularity_day").on(table.day),
]);
