import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase";
import { calculateReadTime } from "../lib/newsUtils";
import { sanitizeHtml } from "../lib/sanitize";
import type { NewsPost, NewsStatus } from "../types/news";

type AutoSaveData = Partial<Omit<NewsPost, "id" | "createdAt" | "updatedAt">>;

interface UseAutoSaveParams {
  formData: AutoSaveData;
  docId: string | null;
  isDirty: boolean;
  status: NewsStatus;
}

export function useAutoSave({ formData, docId, isDirty, status }: UseAutoSaveParams) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const saveStatus = isSaving ? "saving" : isDirty ? "unsaved" : "saved";

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    if (!docId || !isDirty || status !== "draft") {
      return;
    }

    timerRef.current = window.setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateDoc(doc(db, "news", docId), {
          ...formData,
          body: formData.body ? sanitizeHtml(formData.body) : "",
          readTime: calculateReadTime(formData.body ?? ""),
          updatedAt: serverTimestamp(),
        });
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }, 30000);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [docId, formData, isDirty, status]);

  return { lastSaved, isSaving, saveStatus };
}
