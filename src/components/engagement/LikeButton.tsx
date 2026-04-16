"use client";

import { useOptimistic, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  contentId: string;
  initialCount: number;
  initialLiked: boolean;
}

export default function LikeButton({ contentId, initialCount, initialLiked }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Optimistic UI — update immediately before server responds
  const [optimisticState, setOptimisticLiked] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (current, action: "toggle") => {
      if (action === "toggle") {
        return {
          liked: !current.liked,
          count: current.liked ? current.count - 1 : current.count + 1,
        };
      }
      return current;
    }
  );

  const handleLike = () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      setOptimisticLiked("toggle");
      await fetch("/api/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, type: "LIKE" }),
      });
    });
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        optimisticState.liked
          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
      aria-label={optimisticState.liked ? "Unlike" : "Like"}
    >
      <svg
        className="h-4 w-4"
        fill={optimisticState.liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{optimisticState.count}</span>
    </button>
  );
}
