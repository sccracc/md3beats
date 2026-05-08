import { collection, onSnapshot, query, where, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { newsPostFromDoc } from "../lib/newsUtils";
import type { NewsCategory, NewsPost } from "../types/news";

export type NewsSort = "newest" | "oldest" | "views";

interface UseNewsQueryParams {
  category: NewsCategory | "all";
  sortBy: NewsSort;
  pageSize: number;
}

function isVisible(post: NewsPost) {
  if (post.status !== "published") {
    return false;
  }
  if (!post.scheduledAt) {
    return true;
  }
  return post.scheduledAt.toDate().getTime() <= Date.now();
}

function sortPosts(posts: NewsPost[], sortBy: NewsSort) {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    const aDate = a.publishedAt?.toMillis() ?? a.createdAt.toMillis();
    const bDate = b.publishedAt?.toMillis() ?? b.createdAt.toMillis();
    if (sortBy === "views") {
      if (b.views !== a.views) return b.views - a.views;
      return bDate - aDate;
    }
    return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
  });
}

export function useNewsQuery({ category, sortBy, pageSize }: UseNewsQueryParams) {
  const [allPosts, setAllPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(pageSize);

  useEffect(() => {
    setPageLimit(pageSize);
  }, [category, sortBy, pageSize]);

  const constraints = useMemo(() => {
    const next = [where("status", "==", "published")];
    if (category !== "all") {
      next.push(where("category", "==", category));
    }
    return next;
  }, [category]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const newsRef = collection(db, "news");
    const q = query(newsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextPosts = snapshot.docs
          .map((item: QueryDocumentSnapshot<DocumentData>) => newsPostFromDoc(item))
          .filter(isVisible);
        setAllPosts(sortPosts(nextPosts, sortBy));
        setLoading(false);
      },
      (err) => {
        console.error("News query failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load news");
        setAllPosts([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [constraints, sortBy]);

  const displayedPosts = useMemo(() => allPosts.slice(0, pageLimit), [allPosts, pageLimit]);
  const hasMore = allPosts.length > pageLimit;

  const loadMore = useCallback(() => {
    setPageLimit((current) => current + pageSize);
  }, [pageSize]);

  return {
    posts: displayedPosts,
    loading,
    error,
    loadMore,
    hasMore,
    total: allPosts.length,
  };
}
