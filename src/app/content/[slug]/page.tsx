import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Navbar from "@/components/ui/Navbar";
import VideoPlayer from "@/components/content/VideoPlayer";
import ArticleReader from "@/components/content/ArticleReader";
import LikeButton from "@/components/engagement/LikeButton";
import BookmarkButton from "@/components/engagement/BookmarkButton";
import { getContentBySlug } from "@/services/content";
import { getProgress } from "@/services/progress";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  if (!content) return { title: "Not Found" };
  return {
    title: `${content.title} — PulseFeed`,
    description: content.description ?? undefined,
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const content = await getContentBySlug(slug, session?.user?.id);
  if (!content || !content.published) notFound();

  // Atomic view count increment
  await prisma.content.update({
    where: { id: content.id },
    data: { viewCount: { increment: 1 } },
  });

  const progress = session?.user?.id
    ? await getProgress(session.user.id, content.id)
    : null;

  const isLiked =
    content.engagements?.some((e) => e.type === "LIKE") ?? false;
  const isBookmarked =
    content.engagements?.some((e) => e.type === "BOOKMARK") ?? false;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              content.type === "VIDEO"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {content.type === "VIDEO" ? "▶ Video" : "📄 Article"}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {content.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {content.authorName && <span>by {content.authorName}</span>}
            <span>
              {new Date(content.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>{content.viewCount.toLocaleString()} views</span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {content.type === "VIDEO" ? (
            <VideoPlayer
              key={content.url}
              contentId={content.id}
              url={content.url}
              initialPosition={progress?.lastPosition ?? 0}
            />
          ) : (
            <ArticleReader
              contentId={content.id}
              body={content.url}
              initialPosition={progress?.lastPosition ?? 0}
            />
          )}
        </div>

        {/* Description */}
        {content.description && content.type === "VIDEO" && (
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {content.description}
          </p>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <LikeButton
            contentId={content.id}
            initialCount={content.likeCount}
            initialLiked={isLiked}
          />
          <BookmarkButton
            contentId={content.id}
            initialCount={content.bookmarkCount}
            initialBookmarked={isBookmarked}
          />
        </div>

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
