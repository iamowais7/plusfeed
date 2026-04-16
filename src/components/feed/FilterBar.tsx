"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "VIDEO", label: "Videos" },
  { value: "ARTICLE", label: "Articles" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "trending", label: "Trending" },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "ALL";
  const currentSort = searchParams.get("sort") ?? "latest";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      params.delete("cursor"); // reset pagination on filter change
      router.push(`/feed?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Content type filter */}
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("type", opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              currentType === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("sort", opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              currentSort === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
