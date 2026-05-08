import type { NewsCategory } from "../types/news";

export const NEWS_CATEGORIES: NewsCategory[] = [
  "release",
  "collab",
  "announcement",
  "behind-the-scenes",
  "interview",
  "update",
];

export const CATEGORY_COLORS: Record<string, string> = {
  release: "#00D1FF",
  collab: "#a855f7",
  announcement: "#f59e0b",
  "behind-the-scenes": "#22c55e",
  interview: "#ec4899",
  update: "rgba(255,255,255,0.5)",
};

export const CATEGORY_LABELS: Record<string, string> = {
  release: "Release",
  collab: "Collab",
  announcement: "Announcement",
  "behind-the-scenes": "Behind the Scenes",
  interview: "Interview",
  update: "Update",
};
