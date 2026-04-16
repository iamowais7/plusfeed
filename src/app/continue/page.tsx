import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { auth } from "@/lib/auth";
import { getContinueWatching } from "@/services/progress";

export default async function ContinuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await getContinueWatching(session.user.id, 20);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Continue Watching / Reading
        </h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No in-progress content.{" "}
              <Link href="/feed" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Explore the feed
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.content.slug}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Progress bar */}
                <div className="flex-shrink-0">
                  <div className="relative h-12 w-12">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeDasharray={`${item.lastPosition}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {item.lastPosition}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-semibold ${
                      item.content.type === "VIDEO"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.content.type === "VIDEO" ? "▶ Video" : "📄 Article"}
                  </span>
                  <h3 className="mt-0.5 truncate font-medium text-gray-900 dark:text-white">
                    {item.content.title}
                  </h3>
                  {item.content.description && (
                    <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                      {item.content.description}
                    </p>
                  )}
                </div>

                <svg
                  className="h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
