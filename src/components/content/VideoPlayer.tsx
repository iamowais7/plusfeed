"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Props {
  contentId: string;
  url: string;
  initialPosition?: number;
}

function isYouTubeUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string) {
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^?&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
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

  const debouncedSync = useCallback(
    (position: number, completed = false) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => syncProgress(position, completed), 5000);
    },
    [syncProgress]
  );

  useEffect(() => {
    if (isYouTubeUrl(url)) return; // YouTube handles its own progress
    const video = videoRef.current;
    if (!video) return;

    if (initialPosition > 0) video.currentTime = initialPosition;

    const onTimeUpdate = () => debouncedSync(video.currentTime);
    const onEnded = () => syncProgress(video.duration, true);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (video.currentTime > 0 && video.currentTime !== lastSyncedRef.current) {
        syncProgress(video.currentTime, video.ended);
      }
    };
  }, [debouncedSync, syncProgress, initialPosition, url]);

  // ── YouTube embed ──────────────────────────────────────────────────────────
  if (isYouTubeUrl(url)) {
    const embedUrl = getYouTubeEmbedUrl(url);
    return (
      <div className="overflow-hidden rounded-xl bg-black">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`${embedUrl}?rel=0&modestbranding=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Player"
          />
        </div>
      </div>
    );
  }

  // ── Direct MP4 / other video ───────────────────────────────────────────────
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
