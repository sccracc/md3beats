import {
  Archive,
  BarChart3,
  Copy,
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { calculateReadTime, formatDate, newsPostFromDoc, slugify, stripHtml, timestampToDateTimeLocal } from "../lib/newsUtils";
import { CATEGORY_COLORS, CATEGORY_LABELS, NEWS_CATEGORIES } from "../lib/categories";
import { sanitizeHtml } from "../lib/sanitize";
import { uploadToCloudinary } from "../lib/cloudinary";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAutoSave } from "../hooks/useAutoSave";
import { useToast } from "../hooks/useToast";
import ArticleModal from "../components/ArticleModal";
import RichTextEditor from "../components/RichTextEditor";
import type { NewsCategory, NewsPost, NewsStatus } from "../types/news";

type Section = "posts" | "editor" | "analytics" | "settings";
type StatusFilter = "all" | NewsStatus;

const navItems: Array<{ key: Section; icon: LucideIcon; label: string }> = [
  { key: "posts", icon: FileText, label: "All Posts" },
  { key: "editor", icon: Edit3, label: "New Post" },
  { key: "analytics", icon: BarChart3, label: "Analytics" },
  { key: "settings", icon: Settings, label: "Settings" },
];

interface PostForm {
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
  externalLink: string;
  externalLinkLabel: string;
  scheduledAt: string;
  publishedAt: string;
  authorNote: string;
  seoTitle: string;
  seoDescription: string;
}

interface Stats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  views: number;
}

const emptyForm: PostForm = {
  title: "",
  subtitle: "",
  slug: "",
  category: "release",
  status: "draft",
  featured: false,
  pinned: false,
  coverImageUrl: "",
  coverImageAlt: "",
  excerpt: "",
  body: "",
  tags: [],
  externalLink: "",
  externalLinkLabel: "",
  scheduledAt: "",
  publishedAt: "",
  authorNote: "",
  seoTitle: "",
  seoDescription: "",
};

function formFromPost(post: NewsPost): PostForm {
  return {
    title: post.title,
    subtitle: post.subtitle,
    slug: post.slug,
    category: post.category,
    status: post.status,
    featured: post.featured,
    pinned: post.pinned,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags,
    externalLink: post.externalLink ?? "",
    externalLinkLabel: post.externalLinkLabel ?? "",
    scheduledAt: timestampToDateTimeLocal(post.scheduledAt),
    publishedAt: timestampToDateTimeLocal(post.publishedAt),
    authorNote: post.authorNote,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  };
}

function timestampFromLocal(value: string) {
  return value ? Timestamp.fromDate(new Date(value)) : null;
}

function statusColor(status: NewsStatus) {
  if (status === "published") return "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10";
  if (status === "draft") return "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10";
  return "text-white/45 border-white/10 bg-white/5";
}

function relativeTime(timestamp: Timestamp | null) {
  if (!timestamp) return "No date";
  const diff = Date.now() - timestamp.toDate().getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const { addToast } = useToast();
  const [section, setSection] = useState<Section>("posts");
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [isDirty, setIsDirty] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [previewPost, setPreviewPost] = useState<NewsPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsPost | null>(null);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const autosaveData = useMemo(
    () => ({
      ...form,
      externalLink: form.externalLink || null,
      externalLinkLabel: form.externalLinkLabel || null,
      scheduledAt: timestampFromLocal(form.scheduledAt),
      publishedAt: timestampFromLocal(form.publishedAt),
      readTime: calculateReadTime(form.body),
    }),
    [form],
  );
  const { lastSaved, isSaving, saveStatus } = useAutoSave({ formData: autosaveData, docId: editingId, isDirty, status: form.status });

  useEffect(() => {
    const unsubscribe = query(collection(db, "news"), orderBy("updatedAt", "desc"));
    const run = async () => {
      setLoadingPosts(true);
      try {
        const snapshot = await getDocs(unsubscribe);
        setPosts(snapshot.docs.map(newsPostFromDoc));
      } catch {
        addToast({ type: "error", message: "Could not load posts." });
      } finally {
        setLoadingPosts(false);
      }
    };
    void run();
  }, [addToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const stats = useMemo<Stats>(() => {
    return posts.reduce(
      (acc, post) => ({
        total: acc.total + 1,
        published: acc.published + (post.status === "published" ? 1 : 0),
        drafts: acc.drafts + (post.status === "draft" ? 1 : 0),
        archived: acc.archived + (post.status === "archived" ? 1 : 0),
        views: acc.views + post.views,
      }),
      { total: 0, published: 0, drafts: 0, archived: 0, views: 0 },
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesSearch = post.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [debouncedSearch, posts, statusFilter]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const visiblePosts = filteredPosts.slice(page * pageSize, page * pageSize + pageSize);
  const mostViewed = [...posts].sort((a, b) => b.views - a.views)[0] ?? null;

  const refreshPosts = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "news"), orderBy("updatedAt", "desc")));
      setPosts(snapshot.docs.map(newsPostFromDoc));
      addToast({ type: "success", message: "Dashboard refreshed." });
    } catch {
      addToast({ type: "error", message: "Could not refresh posts." });
    }
  };

  const updateForm = <Field extends keyof PostForm>(field: Field, value: PostForm[Field]) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !slugLocked) {
        next.slug = `${slugify(String(value))}-${new Date().getFullYear()}`.replace(/^-|-$/g, "");
      }
      return next;
    });
    setIsDirty(true);
  };

  const resetEditor = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDirty(false);
    setValidation({});
    setSlugLocked(false);
    setSection("editor");
  };

  const editPost = (post: NewsPost) => {
    setEditingId(post.id);
    setForm(formFromPost(post));
    setIsDirty(false);
    setValidation({});
    setSection("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validatePublish = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required.";

    if (!stripHtml(form.body).trim()) next.body = "Body content is required.";
    setValidation(next);
    return Object.keys(next).length === 0;
  };

  const ensureUniqueSlug = async (baseSlug: string, currentId: string | null) => {
    let candidate = baseSlug || `untitled-${new Date().getFullYear()}`;
    let suffix = 2;
    while (true) {
      const snapshot = await getDocs(query(collection(db, "news"), where("slug", "==", candidate), limit(1)));
      const existing = snapshot.docs[0];
      if (!existing || existing.id === currentId) {
        return candidate;
      }
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  };

  const unfeatureExisting = async (nextFeatured: boolean, currentId: string) => {
    if (!nextFeatured) return;
    const snapshot = await getDocs(query(collection(db, "news"), where("featured", "==", true)));
    const batch = writeBatch(db);
    snapshot.docs.forEach((item) => {
      if (item.id !== currentId) {
        batch.update(item.ref, { featured: false, updatedAt: serverTimestamp() });
      }
    });
    await batch.commit();
  };

  const persistPost = async (nextStatus: NewsStatus, validate: boolean) => {
    if (validate && !validatePublish()) {
      addToast({ type: "error", message: "Fix the highlighted fields before publishing." });
      return;
    }

    try {
      const docRef = editingId ? doc(db, "news", editingId) : doc(collection(db, "news"));
      const uniqueSlug = await ensureUniqueSlug(form.slug, editingId);
      await unfeatureExisting(form.featured, docRef.id);
      const existing = editingId ? posts.find((post) => post.id === editingId) : null;
      const firstPublish = nextStatus === "published" && !existing?.publishedAt;
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        slug: uniqueSlug,
        category: form.category,
        status: nextStatus,
        featured: form.featured,
        pinned: form.pinned,
        coverImageUrl: form.coverImageUrl,
        coverImageAlt: form.coverImageAlt,
        excerpt: form.excerpt.slice(0, 280),
        body: sanitizeHtml(form.body),
        tags: form.tags.slice(0, 8),
        externalLink: form.externalLink || null,
        externalLinkLabel: form.externalLinkLabel || null,
        readTime: calculateReadTime(form.body),
        scheduledAt: timestampFromLocal(form.scheduledAt),
        authorNote: form.authorNote,
        seoTitle: form.seoTitle || form.title,
        seoDescription: form.seoDescription || form.excerpt || form.title,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(docRef, {
          ...payload,
          publishedAt: firstPublish ? serverTimestamp() : timestampFromLocal(form.publishedAt) ?? existing?.publishedAt ?? null,
        });
      } else {
        await setDoc(docRef, {
          ...payload,
          views: 0,
          createdAt: serverTimestamp(),
          publishedAt: nextStatus === "published" ? serverTimestamp() : null,
        });
        setEditingId(docRef.id);
      }
      setForm((current) => ({ ...current, status: nextStatus, slug: uniqueSlug }));
      setIsDirty(false);
      await refreshPosts();
      addToast({ type: "success", message: nextStatus === "published" ? "Post published successfully." : "Draft saved." });
    } catch {
      addToast({ type: "error", message: "Could not save post." });
    }
  };

  const handleImage = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      addToast({ type: "error", message: "Upload a JPG, PNG, WEBP, or GIF." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast({ type: "error", message: "Image must be under 10MB." });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, setUploadProgress);
      updateForm("coverImageUrl", url);
      if (!form.coverImageAlt) updateForm("coverImageAlt", file.name.replace(/\.[^.]+$/, ""));
      addToast({ type: "success", message: "Cover uploaded." });
    } catch {
      addToast({ type: "error", message: "Cloudinary upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const addTag = (value: string) => {
    const nextTag = value.trim().replace(/^#/, "");
    if (!nextTag || form.tags.includes(nextTag) || form.tags.length >= 8) return;
    updateForm("tags", [...form.tags, nextTag]);
  };

  const duplicatePost = async (post: NewsPost) => {
    try {
      const { id: _id, ...copyable } = post;
      const docRef = await addDoc(collection(db, "news"), {
        ...copyable,
        title: `Copy of ${post.title}`,
        slug: `copy-of-${post.slug}`,
        status: "draft",
        featured: false,
        pinned: false,
        views: 0,
        publishedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await refreshPosts();
      const copyPost = { ...post, id: docRef.id, title: `Copy of ${post.title}`, slug: `copy-of-${post.slug}`, status: "draft" as const, featured: false, pinned: false, views: 0, publishedAt: null };
      editPost(copyPost);
      addToast({ type: "success", message: "Post duplicated." });
    } catch {
      addToast({ type: "error", message: "Could not duplicate post." });
    }
  };

  const deletePost = async (post: NewsPost) => {
    if (deletePhrase !== "DELETE") return;
    try {
      await deleteDoc(doc(db, "news", post.id));
      setDeleteTarget(null);
      setDeletePhrase("");
      await refreshPosts();
      addToast({ type: "success", message: "Post deleted." });
    } catch {
      addToast({ type: "error", message: "Could not delete post." });
    }
  };

  const setPostStatus = async (post: NewsPost, status: NewsStatus) => {
    try {
      await updateDoc(doc(db, "news", post.id), {
        status,
        updatedAt: serverTimestamp(),
        publishedAt: status === "published" && !post.publishedAt ? serverTimestamp() : post.publishedAt,
      });
      await refreshPosts();
    } catch {
      addToast({ type: "error", message: "Could not update status." });
    }
  };

  const bulkUpdate = async (status: NewsStatus | "delete") => {
    if (!selectedIds.length) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const ref = doc(db, "news", id);
        if (status === "delete") batch.delete(ref);
        else batch.update(ref, { status, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      setSelectedIds([]);
      await refreshPosts();
      addToast({ type: "success", message: "Bulk action complete." });
    } catch {
      addToast({ type: "error", message: "Bulk action failed." });
    }
  };

  const categoryCounts = NEWS_CATEGORIES.map((category) => ({
    category,
    count: posts.filter((post) => post.category === category).length,
  }));
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((item) => item.count));

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <div className="fixed inset-0 pointer-events-none frequency-lines opacity-25" />
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] overflow-y-auto border-r border-white/10 bg-brand-black/85 p-5 backdrop-blur-xl lg:block">
        <div className="font-display text-2xl font-black tracking-tighter">MD3<span className="text-electric-blue">BEATS</span> <span className="text-xs text-white/30">CMS</span></div>
        <p className="mt-3 break-all font-mono text-[10px] text-white/40">{user?.email}</p>
        <div className="my-6 h-px bg-white/10" />
        <nav className="grid gap-2">
          {navItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => (key === "editor" ? resetEditor() : setSection(key))}
              className={`flex items-center gap-3 rounded-xl border-l-[3px] px-4 py-3 text-sm font-bold transition ${
                section === key ? "border-l-electric-blue bg-electric-blue/10 text-electric-blue" : "border-l-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="my-6 h-px bg-white/10" />
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Quick Stats</p>
        <div className="mt-4 grid gap-2 text-sm text-white/55">
          <div className="flex justify-between"><span>Total Posts</span><b>{stats.total}</b></div>
          <div className="flex justify-between"><span>Published</span><b>{stats.published}</b></div>
          <div className="flex justify-between"><span>Drafts</span><b>{stats.drafts}</b></div>
          <div className="flex justify-between"><span>Archived</span><b>{stats.archived}</b></div>
          <div className="flex justify-between"><span>Total Views</span><b>{stats.views}</b></div>
        </div>
        <button
          type="button"
          onClick={() => window.confirm("Sign out?") && void signOut(auth)}
          className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400/60"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </aside>

      <main className="relative z-10 px-5 pb-28 pt-8 lg:ml-[260px] lg:p-8">
        {section === "posts" && (
          <section>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-electric-blue">Dashboard</p>
                <h1 className="font-display text-5xl font-black tracking-tighter">All Posts</h1>
              </div>
              <button type="button" onClick={resetEditor} className="button-slide rounded-full border border-electric-blue px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-electric-blue hover:text-brand-black">
                <span className="relative z-10 inline-flex items-center gap-2"><Plus size={15} /> New Post</span>
              </button>
            </div>
            <div className="glass-card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <label className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts..." className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm outline-none focus:border-electric-blue" />
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "published", "draft", "archived"] as StatusFilter[]).map((item) => (
                  <button key={item} type="button" onClick={() => { setStatusFilter(item); setPage(0); }} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${statusFilter === item ? "border-electric-blue bg-electric-blue/10 text-electric-blue" : "border-white/10 text-white/45"}`}>{item}</button>
                ))}
              </div>
            </div>
            {selectedIds.length > 0 && (
              <div className="glass-card mb-5 flex flex-wrap items-center gap-3 p-4">
                <span className="text-sm font-bold text-white/70">{selectedIds.length} selected</span>
                <button onClick={() => void bulkUpdate("published")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60">Bulk Publish</button>
                <button onClick={() => void bulkUpdate("archived")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60">Bulk Archive</button>
                <button onClick={() => window.confirm(`Delete ${selectedIds.length} posts? This cannot be undone.`) && void bulkUpdate("delete")} className="rounded-full border border-red-500/30 px-3 py-2 text-xs text-red-300">Bulk Delete</button>
              </div>
            )}

            {loadingPosts ? (
              <div className="grid min-h-[300px] place-items-center"><Loader2 className="animate-spin text-electric-blue" /></div>
            ) : visiblePosts.length === 0 ? (
              <div className="glass-card grid min-h-[360px] place-items-center p-8 text-center">
                <div>
                  <ImageIcon className="mx-auto mb-5 text-electric-blue/50" size={54} />
                  <h2 className="font-display text-3xl font-bold">No posts yet. Create your first post.</h2>
                  <button onClick={resetEditor} className="mt-6 rounded-full border border-electric-blue px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-electric-blue">New Post</button>
                </div>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="hidden grid-cols-[40px_64px_1fr_130px_110px_70px_70px_120px_80px_220px] items-center gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/30 xl:grid">
                  <span />
                  <span>Cover</span>
                  <span>Title</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Feat</span>
                  <span>Pin</span>
                  <span>Date</span>
                  <span>Views</span>
                  <span>Actions</span>
                </div>
                {visiblePosts.map((post) => (
                  <div key={post.id} className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[40px_64px_1fr_130px_110px_70px_70px_120px_80px_220px] xl:items-center">
                    <input type="checkbox" checked={selectedIds.includes(post.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, post.id] : current.filter((id) => id !== post.id))} className="h-4 w-4 accent-electric-blue" />
                    <img src={post.coverImageUrl || ""} alt="" className="h-14 w-14 rounded-lg object-cover bg-white/5" />
                    <div><p className="font-display text-lg font-bold">{post.title || "Untitled"}</p><p className="line-clamp-1 text-sm text-white/40">{post.subtitle}</p></div>
                    <span className="w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase" style={{ borderColor: CATEGORY_COLORS[post.category], color: CATEGORY_COLORS[post.category] }}>{CATEGORY_LABELS[post.category]}</span>
                    <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusColor(post.status)}`}>{post.status}</span>
                    <Star size={17} className={post.featured ? "fill-electric-blue text-electric-blue" : "text-white/20"} />
                    <Archive size={17} className={post.pinned ? "text-electric-blue" : "text-white/20"} />
                    <span className="text-sm text-white/45">{post.status === "published" ? formatDate(post.publishedAt) : post.scheduledAt ? `Scheduled ${formatDate(post.scheduledAt)}` : "Draft"}</span>
                    <span className="text-sm text-white/45">{post.views}</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => editPost(post)} className="rounded-full border border-white/10 p-2 text-white/55"><Edit3 size={14} /></button>
                      <button onClick={() => setPreviewPost(post)} className="rounded-full border border-white/10 p-2 text-white/55"><Eye size={14} /></button>
                      <button onClick={() => void duplicatePost(post)} className="rounded-full border border-white/10 p-2 text-white/55"><Copy size={14} /></button>
                      <button onClick={() => void setPostStatus(post, post.status === "archived" ? "draft" : "archived")} className="rounded-full border border-white/10 p-2 text-white/55"><Archive size={14} /></button>
                      <button onClick={() => setDeleteTarget(post)} className="rounded-full border border-red-500/20 p-2 text-red-300/70"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 text-sm text-white/45">
                  <button disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="disabled:opacity-30">Prev</button>
                  <span>Page {page + 1} of {totalPages}</span>
                  <button disabled={page + 1 >= totalPages} onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} className="disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </section>
        )}

        {section === "editor" && (
          <section>
            <div className="sticky top-0 z-30 mb-6 flex flex-col gap-4 border-b border-white/10 bg-brand-black/85 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Dashboard / {editingId ? `Editing: ${form.title || "Untitled"}` : "New Post"}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                  {isSaving ? "Saving..." : saveStatus === "unsaved" ? "Unsaved changes" : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "All changes saved"}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void persistPost("draft", false)} className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/55"><Save size={14} className="mr-2 inline" />Save Draft</button>
                <button onClick={() => void persistPost("published", true)} className="button-slide rounded-full border border-electric-blue px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-electric-blue hover:text-brand-black"><span className="relative z-10">Publish / Update</span></button>
              </div>
            </div>

            <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Post title..." className="mb-2 w-full border-0 bg-transparent font-display text-[clamp(2.5rem,6vw,4rem)] font-black tracking-tighter text-white outline-none placeholder:text-white/15" />
            {validation.title && <p className="mb-2 text-sm text-red-300">{validation.title}</p>}
            <div className="mb-8 flex items-center gap-2 font-mono text-xs text-white/30">
              slug:
              <input value={form.slug} readOnly={!slugLocked} onChange={(event) => updateForm("slug", slugify(event.target.value))} className="min-w-0 flex-1 bg-transparent outline-none read-only:cursor-default" />
              <button type="button" onClick={() => setSlugLocked((value) => !value)} className="text-electric-blue">{slugLocked ? "lock" : "edit"}</button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
              <div className="grid gap-6">
                <div className="glass-card p-5">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-electric-blue">Cover Image</p>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => event.target.files?.[0] && void handleImage(event.target.files[0])} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void handleImage(file); }} onDragOver={(event) => event.preventDefault()} className="grid min-h-[200px] w-full place-items-center rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-center outline-none transition hover:border-electric-blue/40">
                    {form.coverImageUrl ? <img src={form.coverImageUrl} alt={form.coverImageAlt} className="max-h-[240px] w-full rounded-xl object-cover" /> : <div><Upload className="mx-auto mb-3 text-electric-blue" /><p className="text-sm text-white/50">Drop image or click to browse</p></div>}
                  </button>
                  {uploading && <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-electric-blue" style={{ width: `${uploadProgress}%` }} /></div>}
                  <input value={form.coverImageAlt} onChange={(event) => updateForm("coverImageAlt", event.target.value)} placeholder="Cover image alt text" className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-electric-blue" />
                  {validation.coverImageUrl && <p className="mt-2 text-sm text-red-300">{validation.coverImageUrl}</p>}
                  {validation.coverImageAlt && <p className="mt-2 text-sm text-red-300">{validation.coverImageAlt}</p>}
                  {form.coverImageUrl && <button onClick={() => updateForm("coverImageUrl", "")} className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Remove cover</button>}
                </div>
                <div className="glass-card p-5">
                  <RichTextEditor value={form.body} onChange={(html) => updateForm("body", html)} />
                  {validation.body && <p className="mt-2 text-sm text-red-300">{validation.body}</p>}
                </div>
              </div>

              <div className="grid content-start gap-5">
                <MetaPanel title="Core Info">
                  <Input label="Subtitle" value={form.subtitle} onChange={(value) => updateForm("subtitle", value)} />
                  <Textarea label="Excerpt" value={form.excerpt} onChange={(value) => updateForm("excerpt", value)} />
                  <p className={`text-right text-[10px] ${form.excerpt.length > 280 ? "text-red-300" : "text-white/30"}`}>{form.excerpt.length}/280</p>
                  {validation.excerpt && <p className="text-sm text-red-300">{validation.excerpt}</p>}
                  <select value={form.category} onChange={(event) => updateForm("category", event.target.value as NewsCategory)} className="w-full rounded-xl border border-white/10 bg-brand-black px-4 py-3 text-white/70 outline-none focus:border-electric-blue">
                    {NEWS_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
                  </select>
                  <input onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(event.currentTarget.value); event.currentTarget.value = ""; } }} placeholder="Add tag and press Enter" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-electric-blue" />
                  <div className="flex flex-wrap gap-2">{form.tags.map((tag) => <button key={tag} onClick={() => updateForm("tags", form.tags.filter((item) => item !== tag))} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{tag} x</button>)}</div>
                </MetaPanel>

                <MetaPanel title="Publish Settings">
                  <div className="grid grid-cols-3 gap-2">{(["draft", "published", "archived"] as NewsStatus[]).map((status) => <button key={status} onClick={() => updateForm("status", status)} className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase ${form.status === status ? "border-electric-blue bg-electric-blue/10 text-electric-blue" : "border-white/10 text-white/40"}`}>{status}</button>)}</div>
                  <Toggle label="Featured" value={form.featured} onChange={(value) => { if (value) addToast({ type: "warning", message: "This will unfeature the current featured post." }); updateForm("featured", value); }} />
                  <Toggle label="Pinned" value={form.pinned} onChange={(value) => updateForm("pinned", value)} />
                  <Input label="Published Date" type="datetime-local" value={form.publishedAt} onChange={(value) => updateForm("publishedAt", value)} />
                  <Input label="Scheduled Publish" type="datetime-local" value={form.scheduledAt} onChange={(value) => updateForm("scheduledAt", value)} />
                </MetaPanel>

                <MetaPanel title="External Link">
                  <Input label="URL" value={form.externalLink} onChange={(value) => updateForm("externalLink", value)} />
                  <Input label="Label" value={form.externalLinkLabel} onChange={(value) => updateForm("externalLinkLabel", value)} />
                  {form.externalLink && <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/50">{form.externalLinkLabel || "Open Link"}</div>}
                </MetaPanel>

                <MetaPanel title="SEO" collapsible open={seoOpen} onToggle={() => setSeoOpen((value) => !value)}>
                  <Input label="SEO Title" value={form.seoTitle} onChange={(value) => updateForm("seoTitle", value)} />
                  <Textarea label="SEO Description" value={form.seoDescription} onChange={(value) => updateForm("seoDescription", value)} />
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-[#8ab4f8]">{form.seoTitle || form.title || "Post title"}</p>
                    <p className="mt-1 text-xs text-[#bdc1c6]">md3beats.com / news / {form.slug || "slug"}</p>
                    <p className="mt-2 text-xs text-white/45">{form.seoDescription || form.excerpt || "Search description preview..."}</p>
                  </div>
                </MetaPanel>

                <MetaPanel title="Private Notes">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30"><Lock size={12} /> Internal only</div>
                  <Textarea label="Author Note" value={form.authorNote} onChange={(value) => updateForm("authorNote", value)} />
                </MetaPanel>

                <MetaPanel title="Danger Zone" collapsible open={dangerOpen} onToggle={() => setDangerOpen((value) => !value)} danger>
                  {editingId && <button onClick={() => setDeleteTarget(posts.find((post) => post.id === editingId) ?? null)} className="w-full rounded-full border border-red-500/30 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-red-300">Delete Post</button>}
                  <button onClick={() => updateForm("status", "archived")} className="w-full rounded-full border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/45">Archive Post</button>
                </MetaPanel>
              </div>
            </div>
          </section>
        )}

        {section === "analytics" && (
          <section>
            <div className="mb-8 flex items-center justify-between"><h1 className="font-display text-5xl font-black tracking-tighter">Analytics</h1><button onClick={() => void refreshPosts()} className="rounded-full border border-white/10 px-4 py-2 text-white/50"><RefreshCw size={15} className="mr-2 inline" />Refresh</button></div>
            {posts.length === 0 ? <div className="glass-card p-12 text-center text-white/45">Not enough data yet. Publish your first post to see stats.</div> : (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="clean-panel p-6"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Total Views</p><p className="mt-3 font-display text-7xl font-black text-electric-blue">{stats.views}</p></div>
                <div className="clean-panel p-6"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Most Viewed</p>{mostViewed && <div className="mt-4 flex gap-4"><img src={mostViewed.coverImageUrl} className="h-16 w-16 rounded-xl object-cover" alt="" /><div><p className="font-bold">{mostViewed.title}</p><p className="text-sm text-white/40">{mostViewed.views} views / {CATEGORY_LABELS[mostViewed.category]}</p></div></div>}</div>
                <div className="clean-panel p-6"><p className="mb-5 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Posts by Category</p><div className="grid gap-3">{categoryCounts.map((item) => <div key={item.category}><div className="mb-1 flex justify-between text-xs text-white/45"><span>{CATEGORY_LABELS[item.category]}</span><span>{item.count}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${(item.count / maxCategoryCount) * 100}%`, backgroundColor: CATEGORY_COLORS[item.category] }} /></div></div>)}</div></div>
                <div className="clean-panel p-6"><p className="mb-5 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Recent Activity</p><div className="grid gap-3">{posts.slice(0, 10).map((post) => <div key={post.id} className="flex justify-between border-b border-white/10 pb-2 text-sm"><span>{post.title || "Untitled"}</span><span className="text-white/35">{post.status} / {relativeTime(post.updatedAt)}</span></div>)}</div></div>
              </div>
            )}
          </section>
        )}

        {section === "settings" && <SettingsPanel userEmail={user?.email ?? ""} onToast={addToast} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-brand-black/90 p-2 backdrop-blur-xl lg:hidden">
        {navItems.map(({ key, icon: Icon }) => (
          <button key={key} onClick={() => (key === "editor" ? resetEditor() : setSection(key))} className={`grid place-items-center rounded-xl py-3 ${section === key ? "text-electric-blue" : "text-white/35"}`}><Icon size={20} /></button>
        ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-brand-black/80 p-5 backdrop-blur-xl">
          <div className="glass-card max-w-sm p-6">
            <h2 className="font-display text-2xl font-bold">Type DELETE to confirm</h2>
            <p className="mt-2 text-sm text-white/45">Delete "{deleteTarget.title}"? This cannot be undone.</p>
            <input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-red-400" />
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeletePhrase(""); }} className="flex-1 rounded-full border border-white/10 py-3 text-sm text-white/55">Cancel</button>
              <button disabled={deletePhrase !== "DELETE"} onClick={() => void deletePost(deleteTarget)} className="flex-1 rounded-full border border-red-500/30 py-3 text-sm text-red-300 disabled:opacity-30">Delete</button>
            </div>
          </div>
        </div>
      )}

      <ArticleModal post={previewPost} onClose={() => setPreviewPost(null)} />
    </div>
  );
}

function MetaPanel({ title, children, collapsible = false, open = true, onToggle, danger = false }: { title: string; children: ReactNode; collapsible?: boolean; open?: boolean; onToggle?: () => void; danger?: boolean }) {
  return (
    <div className={`glass-card p-5 ${danger ? "border-red-500/20" : ""}`}>
      <button type="button" onClick={onToggle} className="mb-4 flex w-full items-center justify-between text-left text-[10px] font-black uppercase tracking-[0.24em] text-electric-blue">
        {title}
        {collapsible && <span className="text-white/35">{open ? "-" : "+"}</span>}
      </button>
      {(!collapsible || open) && <div className="grid gap-4">{children}</div>}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-electric-blue" /></label>;
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}<textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-electric-blue" /></label>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!value)} className={`flex items-center justify-between rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] ${value ? "border-electric-blue bg-electric-blue/10 text-electric-blue" : "border-white/10 text-white/45"}`}><span>{label}</span><span>{value ? "On" : "Off"}</span></button>;
}

function SettingsPanel({ userEmail, onToast }: { userEmail: string; onToast: (toast: { type: "success" | "error" | "info" | "warning"; message: string }) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const currentUser = auth.currentUser;
  const strength = [newPassword.length >= 8, /\d/.test(newPassword), /[^a-zA-Z0-9]/.test(newPassword), newPassword.length >= 12].filter(Boolean).length;

  const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser?.email) return;
    if (newPassword !== confirmPassword || strength < 3) {
      onToast({ type: "error", message: "Password does not meet requirements." });
      return;
    }
    try {
      await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, currentPassword));
      await updatePassword(currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast({ type: "success", message: "Password updated." });
    } catch {
      onToast({ type: "error", message: "Could not update password." });
    }
  };

  return (
    <section>
      <h1 className="mb-8 font-display text-5xl font-black tracking-tighter">Settings</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handlePassword} className="glass-card grid gap-4 p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-electric-blue">Change Password</p>
          <Input label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} />
          <Input label="New password" type="password" value={newPassword} onChange={setNewPassword} />
          <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((index) => <div key={index} className={`h-1 rounded-full ${index < strength ? "bg-electric-blue" : "bg-white/10"}`} />)}</div>
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          <button className="button-slide rounded-full border border-electric-blue px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-electric-blue hover:text-brand-black"><span className="relative z-10">Update Password</span></button>
        </form>
        <div className="glass-card p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-electric-blue">Account Info</p>
          <div className="mt-5 grid gap-3 text-sm text-white/50">
            <p>Email: {userEmail}</p>
            <p>Created: {currentUser?.metadata.creationTime ?? "Unavailable"}</p>
            <p>Last sign-in: {currentUser?.metadata.lastSignInTime ?? "Unavailable"}</p>
          </div>
          <button onClick={() => void signOut(auth)} className="mt-8 rounded-full border border-red-500/30 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-red-300">Sign Out All Sessions</button>
        </div>
      </div>
    </section>
  );
}
