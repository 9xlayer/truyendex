import { ReadingHistory } from "@/types";
import useLocalStorage from "./useLocalStorage";
import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";

export default function useReadingHistory() {
  const [history, setHistory] = useLocalStorage<Record<string, ReadingHistory>>(
    "truyendex-history",
    {},
  );
  const syncedRef = useRef(false);

  // Fetch server history if user is authenticated
  const { data: serverHistoryData, mutate: mutateServerHistory } = useSWR(
    "/api/auth/local/history",
    async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return (data.history || {}) as Record<string, ReadingHistory>;
      } catch {
        return null;
      }
    },
    {
      revalidateOnFocus: false,
    },
  );

  // Merge server history with local history once loaded
  useEffect(() => {
    if (!serverHistoryData || syncedRef.current) return;
    syncedRef.current = true;

    setHistory((localHistory) => {
      const merged: Record<string, ReadingHistory> = { ...serverHistoryData };
      for (const [id, localItem] of Object.entries(localHistory)) {
        if (!merged[id]) {
          merged[id] = localItem;
        } else {
          const serverTime = merged[id].updatedAt
            ? new Date(merged[id].updatedAt!).getTime()
            : 0;
          const localTime = localItem.updatedAt
            ? new Date(localItem.updatedAt!).getTime()
            : 0;
          if (localTime >= serverTime) {
            merged[id] = localItem;
          }
        }
      }

      // Also sync any local-only items back up to server database
      const localKeys = Object.keys(localHistory);
      if (localKeys.length > 0) {
        fetch("/api/auth/local/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch: localHistory }),
        }).catch(() => {});
      }

      return merged;
    });
  }, [serverHistoryData, setHistory]);

  const addHistory = useCallback(
    (mangaId: string, manga: ReadingHistory) => {
      const now = new Date().toISOString();
      const itemWithTime: ReadingHistory = {
        ...manga,
        updatedAt: now,
      };

      setHistory((value) => {
        const copy = { ...value };
        delete copy[mangaId];
        const next = { [mangaId]: itemWithTime, ...copy };
        const keys = Object.keys(next);
        if (keys.length > 100) {
          delete next[keys[keys.length - 1]];
        }
        return next;
      });

      // Persist to server (SQLite) if logged in
      fetch("/api/auth/local/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manga_id: mangaId,
          manga_title: itemWithTime.mangaTitle,
          cover: itemWithTime.cover,
          chapter_id: itemWithTime.chapterId,
          chapter_title: itemWithTime.chapterTitle,
        }),
      })
        .then(() => mutateServerHistory())
        .catch(() => {});
    },
    [setHistory, mutateServerHistory],
  );

  const removeHistory = useCallback(
    (mangaId: string) => {
      setHistory((value) => {
        const copy = { ...value };
        delete copy[mangaId];
        return copy;
      });

      // Remove from server (SQLite) if logged in
      fetch("/api/auth/local/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          manga_id: mangaId,
        }),
      })
        .then(() => mutateServerHistory())
        .catch(() => {});
    },
    [setHistory, mutateServerHistory],
  );

  return { history, setHistory, addHistory, removeHistory };
}
