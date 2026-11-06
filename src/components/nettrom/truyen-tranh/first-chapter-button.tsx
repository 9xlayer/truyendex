"use client";

import { useCallback, useState } from "react";
import { useRouter } from "nextjs-toploader/app";

import { Button } from "../Button";
import { toast } from "react-toastify";
import { Constants } from "@/constants";
import Iconify from "@/components/iconify";
import useReadingHistory from "@/hooks/useReadingHistory";
import { MeosssApi } from "@/api/meosss";

export default function FirstChapterButton({ mangaId }: { mangaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { history } = useReadingHistory();
  const lastRead = history[mangaId];

  const handleRead = useCallback(async () => {
    if (lastRead?.chapterId) {
      router.push(Constants.Routes.nettrom.chapter(lastRead.chapterId));
      return;
    }

    setLoading(true);
    try {
      const res = await MeosssApi.getChapters(mangaId);
      if (res && res.data && res.data.length > 0) {
        // Chapters are usually sorted descending, so the first chapter is the last item
        const firstChapter = res.data[res.data.length - 1];
        setLoading(false);
        router.push(Constants.Routes.nettrom.chapter(firstChapter.id));
      } else {
        toast("Truyện này chưa có chương nào", { type: "info" });
        setLoading(false);
      }
    } catch {
      toast("Không thể tải danh sách chương", { type: "error" });
      setLoading(false);
    }
  }, [mangaId, lastRead, router]);

  return (
    <Button
      onClick={handleRead}
      className="w-full font-medium sm:w-auto"
      icon={
        loading ? (
          <Iconify icon="uil:spinner" className="animate-spin" />
        ) : (
          <Iconify icon={lastRead ? "fa:history" : "fa:eye"} />
        )
      }
      disabled={loading}
    >
      {lastRead
        ? `Đọc tiếp (${lastRead.chapterTitle}${
            lastRead.page && lastRead.page > 0
              ? ` - Trang ${lastRead.page + 1}`
              : ""
          })`
        : "Đọc từ đầu"}
    </Button>
  );
}
