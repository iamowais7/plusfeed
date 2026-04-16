"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "@/components/ui/SearchBar";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/feed"
          className="flex-shrink-0 text-xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          PulseFeed
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {session?.user ? (
            <>
              <Link
                href="/continue"
                className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Continue
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden sm:inline text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
