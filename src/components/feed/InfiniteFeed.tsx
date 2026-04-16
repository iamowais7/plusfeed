"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ContentCard from "@/components/feed/ContentCard";
import SkeletonCard from "@/components/feed/SkeletonCard";

interface FeedItem {
  id: string;
  title: string;
  slug: string;
  type: "VIDEO" | "ARTICLE";
  description?: string | null;
  thumbnail?: string | null;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  authorName?: string | null;
  createdAt: string;
  engagements?: Array<{ type: "LIKE" | "BOOKMARK" }>;
}

interface Props {
  initialItems: FeedItem[];
  initialNextCursor: string | null;
  type: string;
  sort: string;
}

export default function InfiniteFeed({
  initialItems,
  initialNextCursor,
  type,
  sort,
}: Props) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);

    const params = new URLSearchParams({ type, sort, limit: "20" });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/content?${params.toString()}`);
    if (!res.ok) { setLoading(false); return; }

    const data: { feed: FeedItem[]; nextCursor: string | null } = await res.json();
    setItems((prev) => [...prev, ...data.feed]);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [cursor, loading, type, sort]);

  // Reset when filters change
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialNextCursor);
  }, [initialItems, initialNextCursor]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div className="py-20 text-center text-gray-500 dark:text-gray-400">
        No content found. Check back later!
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            {...item}
            createdAt={item.createdAt}
            isLiked={item.engagements?.some((e) => e.type === "LIKE") ?? false}
            isBookmarked={
              item.engagements?.some((e) => e.type === "BOOKMARK") ?? false
            }
          />
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Infinite scroll sentinel */}
      {cursor && <div ref={sentinelRef} className="h-4" />}

      {!cursor && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-600">
          You&apos;ve reached the end!
        </p>
      )}
    </>
  );
}
