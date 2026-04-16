import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import FilterBar from "@/components/feed/FilterBar";
import InfiniteFeed from "@/components/feed/InfiniteFeed";
import { SkeletonGrid } from "@/components/feed/SkeletonCard";
import { getFeed } from "@/services/content";
import { auth } from "@/lib/auth";

interface Props {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    cursor?: string;
  }>;
}

export default async function FeedPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();

  const type = (params.type ?? "ALL") as "VIDEO" | "ARTICLE" | "ALL";
  const sort = (params.sort ?? "latest") as "latest" | "trending";

  const { feed, nextCursor } = await getFeed({
    type,
    sort,
    limit: 20,
    userId: session?.user?.id,
  });

  // Serialize dates for client component
  const serializedFeed = feed.map((item) => ({
    ...item,
    createdAt:
      item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : item.createdAt,
  }));

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discovery Feed
          </h1>
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </div>

        <Suspense fallback={<SkeletonGrid />}>
          <InfiniteFeed
            initialItems={serializedFeed as Parameters<typeof InfiniteFeed>[0]["initialItems"]}
            initialNextCursor={nextCursor}
            type={type}
            sort={sort}
          />
        </Suspense>
      </main>
    </>
  );
}
