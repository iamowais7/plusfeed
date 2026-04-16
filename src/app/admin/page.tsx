import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  // Single query — no N+1
  const [
    totalContent,
    totalVideos,
    totalArticles,
    totalUsers,
    topContent,
  ] = await Promise.all([
    prisma.content.count(),
    prisma.content.count({ where: { type: "VIDEO" } }),
    prisma.content.count({ where: { type: "ARTICLE" } }),
    prisma.user.count(),
    prisma.content.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, viewCount: true, likeCount: true, slug: true },
    }),
  ]);

  const totalViews = await prisma.content.aggregate({
    _sum: { viewCount: true },
  });

  const stats = [
    { label: "Total Content", value: totalContent, color: "indigo" },
    { label: "Videos", value: totalVideos, color: "red" },
    { label: "Articles", value: totalArticles, color: "blue" },
    { label: "Users", value: totalUsers, color: "green" },
    { label: "Total Views", value: totalViews._sum.viewCount ?? 0, color: "yellow" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Top Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Top Content by Views
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {topContent.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-6 py-3"
            >
              <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.type}
                </p>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>{item.viewCount.toLocaleString()} views</div>
                <div>{item.likeCount} likes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
