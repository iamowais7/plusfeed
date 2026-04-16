import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { searchContent } from "@/services/content";

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? "";
  const type = (params.q ? params.type ?? "ALL" : "ALL") as "VIDEO" | "ARTICLE" | "ALL";

  const results =
    query.trim().length >= 1
      ? await searchContent({ query, type, limit: 30 })
      : [];

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {query ? `Search results for "${query}"` : "Search PulseFeed"}
        </h1>
        {query && (
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
        )}

        {results.length === 0 && query && (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No results found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        <Suspense fallback={null}>
          <div className="space-y-3">
            {results.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.slug}`}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-semibold ${
                      item.type === "VIDEO"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.type === "VIDEO" ? "▶ Video" : "📄 Article"}
                  </span>
                  <h3 className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    <span>{item.viewCount.toLocaleString()} views</span>
                    <span>{item.likeCount} likes</span>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-gray-400 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </Suspense>
      </main>
    </>
  );
}
