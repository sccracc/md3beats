import type { Timestamp } from "firebase/firestore";

export type NewsCategory =
  | "release"
  | "collab"
  | "announcement"
  | "behind-the-scenes"
  | "interview"
  | "update";

export type NewsStatus = "published" | "draft" | "archived";

export interface NewsPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  category: NewsCategory;
  status: NewsStatus;
  featured: boolean;
  pinned: boolean;
  coverImageUrl: string;
  coverImageAlt: string;
  excerpt: string;
  body: string;
  tags: string[];
  externalLink: string | null;
  externalLinkLabel: string | null;
  readTime: number;
  views: number;
  publishedAt: Timestamp | null;
  scheduledAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorNote: string;
  seoTitle: string;
  seoDescription: string;
}

export type NewsPostInput = Omit<NewsPost, "id" | "createdAt" | "updatedAt" | "publishedAt" | "views"> & {
  views?: number;
  publishedAt?: Timestamp | null;
};
