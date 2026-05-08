import { ExternalLink, Pin } from "lucide-react";
import { memo, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../lib/categories";
import { formatDate, isNewPost } from "../lib/newsUtils";
import type { NewsPost } from "../types/news";

interface NewsCardProps {
  post: NewsPost;
  onOpen: (post: NewsPost) => void;
}

function NewsCard({ post, onOpen }: NewsCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = CATEGORY_COLORS[post.category];
  const visibleTags = post.tags.slice(0, 3);
  const extraTags = Math.max(0, post.tags.length - visibleTags.length);

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="group glass-card magnetic-card w-full overflow-hidden p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
    >
      {post.coverImageUrl && !imageFailed && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.035]">
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
          <span
            className="absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl"
            style={{ borderColor: color, backgroundColor: `${color}22` }}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {isNewPost(post.publishedAt) && (
              <span className="new-pulse rounded-full border border-electric-blue/40 bg-brand-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-electric-blue">
                New
              </span>
            )}
            {post.pinned && (
              <span className="rounded-full border border-white/15 bg-brand-black/70 p-1.5 text-electric-blue">
                <Pin size={13} aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      )}

      {!post.coverImageUrl || imageFailed ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 px-3 pt-0">
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white"
            style={{ borderColor: color, backgroundColor: `${color}22` }}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          {isNewPost(post.publishedAt) && (
            <span className="new-pulse rounded-full border border-electric-blue/40 bg-brand-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-electric-blue">
              New
            </span>
          )}
          {post.pinned && (
            <span className="rounded-full border border-white/15 bg-brand-black/70 p-1.5 text-electric-blue">
              <Pin size={13} aria-hidden="true" />
            </span>
          )}
        </div>
      ) : null}

      <div className="p-3">
        <h3 className="line-clamp-2 font-display text-2xl font-bold leading-tight tracking-tight text-white transition group-hover:text-electric-blue">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-1 font-serif text-base italic text-white/50">{post.subtitle}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/48">{post.excerpt}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              +{extraTags} more
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/32">
          <span>{formatDate(post.publishedAt)}</span>
          <span>/</span>
          <span>{post.readTime} min read</span>
          {post.externalLink && <ExternalLink size={12} className="text-electric-blue/70" aria-hidden="true" />}
        </div>
      </div>
    </button>
  );
}

export default memo(NewsCard);
