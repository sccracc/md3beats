import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import type { NewsCategory, NewsPost, NewsStatus } from "../types/news";

const allowedCategories: NewsCategory[] = [
  "release",
  "collab",
  "announcement",
  "behind-the-scenes",
  "interview",
  "update",
];

const allowedStatuses: NewsStatus[] = ["published", "draft", "archived"];

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function calculateReadTime(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean);
  return Math.max(1, Math.ceil(words.length / 200));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) {
    return "Draft";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp.toDate());
}

export function isNewPost(timestamp: Timestamp | null) {
  if (!timestamp) {
    return false;
  }
  return Date.now() - timestamp.toDate().getTime() < 48 * 60 * 60 * 1000;
}

export function timestampToDateTimeLocal(timestamp: Timestamp | null) {
  if (!timestamp) {
    return "";
  }
  const date = timestamp.toDate();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function normalizeCategory(value: unknown): NewsCategory {
  return allowedCategories.includes(value as NewsCategory) ? (value as NewsCategory) : "update";
}

function normalizeStatus(value: unknown): NewsStatus {
  return allowedStatuses.includes(value as NewsStatus) ? (value as NewsStatus) : "draft";
}

function normalizeTimestamp(value: unknown): Timestamp | null {
  return value && typeof value === "object" && "toDate" in value ? (value as Timestamp) : null;
}

function normalizeTags(value: unknown) {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string").slice(0, 8) : [];
}

export function newsPostFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): NewsPost {
  const data = snapshot.data();
  const createdAt = normalizeTimestamp(data.createdAt);
  const updatedAt = normalizeTimestamp(data.updatedAt);

  return {
    id: snapshot.id,
    title: normalizeString(data.title),
    subtitle: normalizeString(data.subtitle),
    slug: normalizeString(data.slug),
    category: normalizeCategory(data.category),
    status: normalizeStatus(data.status),
    featured: normalizeBoolean(data.featured),
    pinned: normalizeBoolean(data.pinned),
    coverImageUrl: normalizeString(data.coverImageUrl),
    coverImageAlt: normalizeString(data.coverImageAlt),
    excerpt: normalizeString(data.excerpt),
    body: normalizeString(data.body),
    tags: normalizeTags(data.tags),
    externalLink: normalizeNullableString(data.externalLink),
    externalLinkLabel: normalizeNullableString(data.externalLinkLabel),
    readTime: normalizeNumber(data.readTime),
    views: normalizeNumber(data.views),
    publishedAt: normalizeTimestamp(data.publishedAt),
    scheduledAt: normalizeTimestamp(data.scheduledAt),
    createdAt: createdAt ?? updatedAt ?? Timestamp.now(),
    updatedAt: updatedAt ?? createdAt ?? Timestamp.now(),
    authorNote: normalizeString(data.authorNote),
    seoTitle: normalizeString(data.seoTitle),
    seoDescription: normalizeString(data.seoDescription),
  };
}
