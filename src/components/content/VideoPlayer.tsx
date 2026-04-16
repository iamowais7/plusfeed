"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Props {
  contentId: string;
  url: string;
  initialPosition?: number;
}

export default function VideoPlayer({ contentId, url, initialPosition = 0 }: Props) {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<number>(0);

  const syncProgress = useCallback(
    async (position: number, completed: boolean) => {
      if (!session?.user?.id) return;
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          lastPosition: Math.floor(position),
          isCompleted: completed,
        }),
      });
      lastSyncedRef.current = position;
    },
    [contentId, session?.user?.id]
  );

  // Debounced progress sync — only every 5s of playback or on unmount
  const debouncedSync = useCallback(
    (position: number, completed = false) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => syncProgress(position, completed), 5000);
    },
    [syncProgress]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Restore previous position
    if (initialPosition > 0) video.currentTime = initialPosition;

    const onTimeUpdate = () => debouncedSync(video.currentTime);
    const onEnded = () => syncProgress(video.duration, true);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    // Sync on component unmount (tab close, navigation)
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Final sync on unmount
      if (video.currentTime > 0 && video.currentTime !== lastSyncedRef.current) {
        syncProgress(video.currentTime, video.ended);
      }
    };
  }, [debouncedSync, syncProgress, initialPosition]);

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        controls
        className="w-full max-h-[70vh]"
        src={url}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
