import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/feed");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin topbar */}
      <header className="border-b border-gray-200 bg-gray-900 dark:border-gray-700">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-bold text-white">
              PulseFeed <span className="text-xs text-gray-400">Admin</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/content"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Content
              </Link>
              <Link
                href="/admin/content/new"
                className="text-gray-300 hover:text-white transition-colors"
              >
                + New
              </Link>
            </nav>
          </div>
          <Link
            href="/feed"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← View Site
          </Link>
        </div>
      </header>

      <div className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
