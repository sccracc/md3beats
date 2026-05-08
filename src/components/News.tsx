import { ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS, NEWS_CATEGORIES } from "../lib/categories";
import { formatDate } from "../lib/newsUtils";
import { useNewsQuery, type NewsSort } from "../hooks/useNewsQuery";
import type { NewsCategory, NewsPost } from "../types/news";
import ArticleModal from "./ArticleModal";
import AudioVisualizer from "./AudioVisualizer";
import NewsCard from "./NewsCard";
import SkeletonCard from "./SkeletonCard";

type Filter = NewsCategory | "all";

export default function News() {
  const [category, setCategory] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<NewsSort>("newest");
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const { posts, loading, error, loadMore, hasMore, total } = useNewsQuery({ category, sortBy, pageSize: 9 });

  const featuredPost = useMemo(() => posts.find((post) => post.featured), [posts]);
  const gridPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : posts;

  return (
    <div className="relative min-h-screen px-5 pb-24 pt-32 md:px-12 md:pt-40 lg:px-16">
      <section className="mx-auto max-w-[1440px] text-center">
        <div className="mb-6 inline-flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.36em] text-electric-blue">
          <span className="h-px w-9 bg-electric-blue/60" />
          From the Studio
          <span className="h-px w-9 bg-electric-blue/60" />
        </div>
        <h1 className="font-display text-[clamp(4rem,12vw,7.5rem)] font-black leading-[0.82] tracking-tighter">
          NEWS
          <span className="block font-serif text-[clamp(3rem,8vw,6rem)] font-normal italic text-electric-blue electric-glow">
            &amp; UPDATES
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xs font-bold uppercase tracking-[0.34em] text-white/40">
          Releases / Collabs / Studio Sessions / Announcements
        </p>
        <div className="mx-auto mt-8 max-w-[220px] opacity-70">
          <AudioVisualizer size="sm" />
        </div>
      </section>

      {featuredPost && (
        <button
          type="button"
          onClick={() => setSelectedPost(featuredPost)}
          className={`group mx-auto mt-16 block min-h-[50vh] w-full max-w-[1440px] overflow-hidden rounded-2xl border border-white/10 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-electric-blue ${featuredPost.coverImageUrl ? "bg-cover bg-center" : ""}`}
          style={featuredPost.coverImageUrl ? {
            backgroundImage: `linear-gradient(to top, #050508 0%, rgba(5,5,8,0.25) 58%, rgba(5,5,8,0.08)), url(${featuredPost.coverImageUrl})`,
          } : undefined}
        >
          <div className={`flex min-h-[50vh] flex-col justify-between p-5 backdrop-brightness-100 transition group-hover:backdrop-brightness-110 md:p-8 ${!featuredPost.coverImageUrl ? "bg-white/[0.02]" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl"
                style={{ borderColor: CATEGORY_COLORS[featuredPost.category], backgroundColor: `${CATEGORY_COLORS[featuredPost.category]}22` }}
              >
                {CATEGORY_LABELS[featuredPost.category]}
              </span>
              <div className="flex gap-2">
                {featuredPost.pinned && (
                  <span className="rounded-full border border-white/15 bg-brand-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    Pinned
                  </span>
                )}
                <span className="rounded-full border border-electric-blue/40 bg-electric-blue/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue">
                  Featured
                </span>
              </div>
            </div>

            <div className="max-w-4xl">
              <h2 className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-black leading-none tracking-tighter text-white">
                {featuredPost.title}
              </h2>
              <p className="mt-3 font-serif text-2xl italic text-white/62">{featuredPost.subtitle}</p>
              <p className="mt-4 line-clamp-2 max-w-2xl text-base leading-7 text-white/58">{featuredPost.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/42">
                <span>{featuredPost.readTime} min read</span>
                <span>/</span>
                <span>{formatDate(featuredPost.publishedAt)}</span>
                <span className="inline-flex items-center gap-2 text-electric-blue transition group-hover:underline">
                  Read More <ChevronRight size={14} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      <div className="sticky top-0 z-40 mx-[-20px] mt-14 border-y border-white/10 bg-brand-black/78 px-5 py-4 backdrop-blur-xl md:mx-[-48px] md:px-12 lg:mx-[-64px] lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", ...NEWS_CATEGORIES] as Filter[]).map((item) => {
              const active = category === item;
              const color = item === "all" ? "#00D1FF" : CATEGORY_COLORS[item];
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className="shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] outline-none transition focus-visible:ring-2 focus-visible:ring-electric-blue"
                  style={{
                    borderColor: active ? color : "rgba(255,255,255,0.1)",
                    backgroundColor: active ? color : "rgba(255,255,255,0.03)",
                    color: active ? "#050508" : "rgba(255,255,255,0.55)",
                  }}
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: active ? "#050508" : color }} />
                  {item === "all" ? "All" : CATEGORY_LABELS[item]}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Showing {posts.length} of {total}
            </p>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as NewsSort)}
              className="rounded-full border border-white/10 bg-brand-black/80 px-4 py-2 text-xs font-bold text-white/62 outline-none focus:border-electric-blue"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div layout className="mx-auto mt-8 grid max-w-[1440px] gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : gridPosts.map((post) => <NewsCard key={post.id} post={post} onOpen={setSelectedPost} />)}
      </motion.div>

      {!loading && error && (
        <div className="mx-auto mt-16 max-w-lg text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-red-400">Failed to load news</h2>
          <p className="mt-3 text-sm text-white/50">Check the browser console (F12) for details, then create the required Firestore indexes.</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="mx-auto mt-16 grid max-w-lg place-items-center text-center">
          <svg viewBox="0 0 160 160" className="mb-6 h-28 w-28 text-electric-blue/35">
            <circle cx="80" cy="80" r="58" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="80" cy="80" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M18 80h18M124 80h18M32 52l14 10M114 98l14 10" stroke="currentColor" strokeWidth="2" />
          </svg>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">Nothing here yet. Check back soon.</h2>
          <div className="mt-6 w-56 opacity-60">
            <AudioVisualizer size="sm" />
          </div>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="mt-12 text-center">
          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              className="button-slide rounded-full border border-electric-blue px-8 py-4 text-xs font-black uppercase tracking-[0.24em] text-electric-blue outline-none hover:text-brand-black focus-visible:ring-2 focus-visible:ring-electric-blue"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Load More Posts {loading && <Loader2 className="animate-spin" size={14} />}
              </span>
            </button>
          ) : (
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/20">- You're all caught up -</p>
          )}
        </div>
      )}

      <ArticleModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
