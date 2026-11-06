import { useChapterPages } from "@/hooks/mangadex";
import LazyImages from "./lazy-images";
import useWindowSize from "@/hooks/useWindowSize";
import { useChapterContext } from "@/contexts/chapter";
import { DataLoader } from "@/components/DataLoader";
import { Button } from "../Button";
import CommentSection from "../binh-luan/comment-section";
import { Alert } from "../Alert";
import ScanlationGroupInformation from "./scanlation-group-information";
import Link from "next/link";
import Iconify from "@/components/iconify";
import { Constants } from "@/constants";
import { useMemo, useEffect, useRef } from "react";
import { MangadexApi } from "@/api";
import { useSettingsContext } from "@/contexts/settings";
import useReadingHistory from "@/hooks/useReadingHistory";
import { toast } from "react-toastify";

export default function ChapterPages() {
  const { height } = useWindowSize();

  const { chapterId, canNext, canPrev, next, prev, chapter, group, manga } =
    useChapterContext();

  const { filteredContent } = useSettingsContext();
  const { history, updatePage } = useReadingHistory();
  const hasScrolledRef = useRef(false);

  const lastRead = manga?.id ? history[manga.id] : null;
  const savedPage =
    lastRead?.chapterId === chapterId ? lastRead.page : undefined;

  const shouldBlock = useMemo(() => {
    if (!manga) return false;
    return (
      (!filteredContent.includes(
        MangadexApi.Static.MangaContentRating.PORNOGRAPHIC,
      ) &&
        manga?.attributes.contentRating ===
          MangadexApi.Static.MangaContentRating.PORNOGRAPHIC) ||
      (!filteredContent.includes(
        MangadexApi.Static.MangaContentRating.EROTICA,
      ) &&
        manga?.attributes.contentRating ===
          MangadexApi.Static.MangaContentRating.EROTICA)
    );
  }, [manga, filteredContent]);

  const { pages, isLoading, error } = useChapterPages(
    chapter?.attributes.externalUrl ? null : chapterId,
  );

  // Reset scroll state on chapter change
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [chapterId]);

  // Auto-scroll to last read page
  useEffect(() => {
    if (!pages || pages.length === 0 || isLoading || hasScrolledRef.current) {
      return;
    }
    if (savedPage !== undefined && savedPage > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`chapter-page-${savedPage}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          hasScrolledRef.current = true;
          toast.info(`Tiếp tục đọc từ ảnh thứ ${savedPage + 1}`, {
            autoClose: 2500,
            toastId: `reading-page-${chapterId}`,
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pages, isLoading, savedPage, chapterId]);

  // Track currently read page with IntersectionObserver
  useEffect(() => {
    if (!pages || pages.length === 0 || !manga?.id || isLoading) return;

    let debounceTimer: NodeJS.Timeout;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageAttr = entry.target.getAttribute("data-page");
            if (pageAttr !== null) {
              const pageIndex = parseInt(pageAttr, 10);
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                updatePage(manga.id, pageIndex);
              }, 600);
            }
          }
        }
      },
      {
        rootMargin: "-15% 0px -50% 0px",
        threshold: 0.1,
      },
    );

    const pageElements = document.querySelectorAll(".chapter-page-container");
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [pages, manga?.id, updatePage, isLoading]);

  return (
    <div>
      {error ? (
        <div className="container flex flex-col items-center justify-center gap-2">
          <div className="text-2xl font-bold">Chương này đã bị xoá</div>
          <Link href={Constants.Routes.nettrom.manga(manga?.id || "")}>
            <Button icon={<Iconify icon="fa:arrow-left" />}>
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      ) : chapter?.attributes.externalUrl ? (
        <div className="container flex justify-center">
          <Link href={chapter.attributes.externalUrl} target="_blank">
            <Button icon={<Iconify icon="fa:external-link" />}>
              Đọc tại trang chủ của {group?.attributes.name}
            </Button>
          </Link>
        </div>
      ) : shouldBlock ? (
        <div className="container flex flex-col items-center justify-center gap-2">
          <div className="text-2xl font-bold">
            Chương này có nội dung giới hạn độ tuổi, vui lòng kiểm tra cài đặt
            bộ lọc
          </div>
        </div>
      ) : (
        <DataLoader
          isLoading={isLoading}
          loadingText="Đang tải nội dung chương..."
        >
          {manga &&
            (manga.attributes.contentRating ===
              MangadexApi.Static.MangaContentRating.PORNOGRAPHIC ||
              manga.attributes.contentRating ===
                MangadexApi.Static.MangaContentRating.EROTICA) && (
              <div className="mb-10">
                <Alert
                  title="Phát hiện truyện có thể có nội dung phản cảm theo đánh giá của MangaDex. TruyenDex không chịu trách nhiệm với nội dung của truyện."
                  classNames={{
                    alert: "[&>svg]:text-red-500 text-red-500 bg-red-100",
                  }}
                />
              </div>
            )}
          <div className="reading-detail box_doc">
            <LazyImages images={pages} threshold={(height || 1000) * 3} />
          </div>
        </DataLoader>
      )}
      <div className="container">
        <div className="mb-2 mt-4 flex flex-col gap-2">
          <Button disabled={!canNext} onClick={next}>
            Chương tiếp theo
          </Button>
          <Button disabled={!canPrev} onClick={prev}>
            Chương trước
          </Button>
        </div>
        {group && (
          <ScanlationGroupInformation group={group} canNext={canNext} />
        )}
        <DataLoader isLoading={!chapter} loadingText="Đang tải bình luận...">
          {chapterId &&
            (!chapter || chapter.attributes.translatedLanguage === "vi") && (
              <CommentSection type="chapter" typeId={chapterId} />
            )}
          {chapter && chapter.attributes.translatedLanguage !== "vi" && (
            <Alert title="Chỉ hỗ trợ bình luận tại các chương tiếng Việt" />
          )}
        </DataLoader>
      </div>
    </div>
  );
}
