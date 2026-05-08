import { ArrowLeft, Copy, ExternalLink, Twitter, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { doc, increment, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../lib/categories";
import { db } from "../lib/firebase";
import { formatDate } from "../lib/newsUtils";
import { sanitizeHtml } from "../lib/sanitize";
import type { NewsPost } from "../types/news";

interface ArticleModalProps {
  post: NewsPost | null;
  onClose: () => void;
}

export default function ArticleModal({ post, onClose }: ArticleModalProps) {
  const [copied, setCopied] = useState(false);
  const safeBody = useMemo(() => sanitizeHtml(post?.body ?? ""), [post?.body]);

  useEffect(() => {
    if (!post) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);

    const key = `viewed_${post.id}`;
    if (!sessionStorage.getItem(key)) {
      void updateDoc(doc(db, "news", post.id), { views: increment(1) }).then(() => {
        sessionStorage.setItem(key, "true");
      });
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose, post]);

  if (!post) {
    return null;
  }

  const color = CATEGORY_COLORS[post.category];
  const url = `${window.location.origin}/news#${post.slug}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={post.id}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[100] overflow-y-auto bg-brand-black/98 backdrop-blur-2xl"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="sticky top-0 z-10 border-b border-white/10 bg-brand-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto grid max-w-5xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full text-sm text-white/60 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-electric-blue"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <p className="truncate text-center text-xs font-bold uppercase tracking-[0.18em] text-white/38">{post.title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/60 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-electric-blue"
              aria-label="Close article"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-5 pb-20 pt-8">
          {post.coverImageUrl && (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={post.coverImageUrl} alt={post.coverImageAlt} className="max-h-[480px] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-black to-transparent" />
            </div>
          )}

          <header className="mt-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                style={{ borderColor: color, backgroundColor: `${color}22` }}
              >
                {CATEGORY_LABELS[post.category]}
              </span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-black leading-none tracking-tighter text-white">
              {post.title}
            </h1>
            <p className="mt-5 font-serif text-xl italic leading-8 text-white/60">{post.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              <span>{formatDate(post.publishedAt)}</span>
              <span>/</span>
              <span>{post.readTime} min read</span>
              <span>/</span>
              <span>{post.views} views</span>
            </div>

            {post.externalLink && (
              <a
                href={post.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="button-slide mt-7 inline-flex rounded-full border border-electric-blue px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-electric-blue outline-none hover:text-brand-black focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {post.externalLinkLabel ?? "Open Link"} <ExternalLink size={15} />
                </span>
              </a>
            )}
          </header>

          <div className="my-9 h-px bg-white/10" />
          <div className="prose-md3" dangerouslySetInnerHTML={{ __html: safeBody }} />

          <div className="mt-12 border-t border-white/10 pt-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Share this post</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 outline-none transition hover:border-electric-blue/40 hover:text-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy size={14} /> {copied ? "Copied" : "Copy link"}
                </span>
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 outline-none transition hover:border-electric-blue/40 hover:text-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                <span className="inline-flex items-center gap-2">
                  <Twitter size={14} /> Share on X
                </span>
              </a>
            </div>
          </div>
        </article>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
