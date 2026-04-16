"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Props {
  contentId: string;
  body: string;
  initialPosition?: number;
}

export default function ArticleReader({ contentId, body, initialPosition = 0 }: Props) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef(0);

  const syncProgress = useCallback(
    async (position: number, completed: boolean) => {
      if (!session?.user?.id) return;
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, lastPosition: position, isCompleted: completed }),
      });
      lastSyncedRef.current = position;
    },
    [contentId, session?.user?.id]
  );

  const debouncedSync = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const totalScrollable = scrollHeight - clientHeight;
    const scrollPercent = totalScrollable > 0 ? Math.floor((scrollTop / totalScrollable) * 100) : 0;
    const isCompleted = scrollPercent >= 95;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => syncProgress(scrollPercent, isCompleted), 5000);
  }, [syncProgress]);

  // Restore scroll position
  useEffect(() => {
    if (initialPosition > 0) {
      const totalScrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: (initialPosition / 100) * totalScrollable, behavior: "smooth" });
    }
  }, [initialPosition]);

  useEffect(() => {
    window.addEventListener("scroll", debouncedSync, { passive: true });
    return () => {
      window.removeEventListener("scroll", debouncedSync);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Sync on unmount
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const pos = Math.floor((scrollTop / (scrollHeight - clientHeight)) * 100);
      if (pos !== lastSyncedRef.current) syncProgress(pos, pos >= 95);
    };
  }, [debouncedSync, syncProgress]);

  return (
    <div
      ref={containerRef}
      className="prose prose-lg max-w-none dark:prose-invert
        prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-p:text-gray-700 dark:prose-p:text-gray-300
        prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
