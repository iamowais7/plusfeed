"use client";

import { useOptimistic, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  contentId: string;
  initialCount: number;
  initialBookmarked: boolean;
}

export default function BookmarkButton({
  contentId,
  initialCount,
  initialBookmarked,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [optimisticState, setOptimistic] = useOptimistic(
    { bookmarked: initialBookmarked, count: initialCount },
    (current, action: "toggle") => {
      if (action === "toggle") {
        return {
          bookmarked: !current.bookmarked,
          count: current.bookmarked ? current.count - 1 : current.count + 1,
        };
      }
      return current;
    }
  );

  const handleBookmark = () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      setOptimistic("toggle");
      await fetch("/api/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, type: "BOOKMARK" }),
      });
    });
  };

  return (
    <button
      onClick={handleBookmark}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        optimisticState.bookmarked
          ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
      aria-label={optimisticState.bookmarked ? "Remove bookmark" : "Bookmark"}
    >
      <svg
        className="h-4 w-4"
        fill={optimisticState.bookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{optimisticState.count}</span>
    </button>
  );
}
