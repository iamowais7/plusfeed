import Link from "next/link";
import Image from "next/image";
import LikeButton from "@/components/engagement/LikeButton";
import BookmarkButton from "@/components/engagement/BookmarkButton";

interface ContentCardProps {
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
  createdAt: Date | string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export default function ContentCard({
  id,
  title,
  slug,
  type,
  description,
  thumbnail,
  viewCount,
  likeCount,
  bookmarkCount,
  authorName,
  createdAt,
  isLiked = false,
  isBookmarked = false,
}: ContentCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Thumbnail */}
      <Link href={`/content/${slug}`} className="relative block overflow-hidden bg-gray-100 dark:bg-gray-700">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            width={400}
            height={225}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center">
            {type === "VIDEO" ? (
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
        )}
        {/* Type badge */}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
          type === "VIDEO"
            ? "bg-red-600 text-white"
            : "bg-blue-600 text-white"
        }`}>
          {type === "VIDEO" ? "▶ Video" : "📄 Article"}
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/content/${slug}`} className="flex-1">
          <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </Link>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <span>{date}</span>
            {authorName && <span className="ml-1">· {authorName}</span>}
            <span className="ml-1">· {viewCount.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LikeButton contentId={id} initialCount={likeCount} initialLiked={isLiked} />
            <BookmarkButton contentId={id} initialCount={bookmarkCount} initialBookmarked={isBookmarked} />
          </div>
        </div>
      </div>
    </article>
  );
}
