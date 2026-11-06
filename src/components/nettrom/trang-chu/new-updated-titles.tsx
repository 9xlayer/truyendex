"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

import { useLastUpdates } from "@/hooks/mangadex";
import { useMangadex } from "@/contexts/mangadex";

import { ExtendChapter, ExtendManga } from "@/types/mangadex";
import { Constants } from "@/constants";
import { FaClock } from "react-icons/fa";
import { DataLoader } from "@/components/DataLoader";
import { Utils } from "@/utils";
import useReadingHistory from "@/hooks/useReadingHistory";
import { useSettingsContext } from "@/contexts/settings";

import Pagination from "../Pagination";
import MangaTile from "../manga-tile";

export default function LastestChapters({
  title,
  groupId,
}: {
  title?: string;
  groupId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Number(params.get("page")) || 0;
  const [totalPage, setTotalPage] = useState(0);
  const { history } = useReadingHistory();
  const { filteredLanguages, filteredContent, originLanguages } =
    useSettingsContext();
  const { chapters, isLoading, error, total } = useLastUpdates({
    page,
    groupId,
    filteredLanguages,
    filteredContentRating: filteredContent,
    originLanguages,
  });
  const { mangas, mangaStatistics, addMangas, updateMangaStatistics } =
    useMangadex();
  const updates: Record<string, ExtendChapter[]> = {};

  if (chapters) {
    for (const chapter of chapters) {
      const mangaId = chapter.manga?.id;
      if (!mangaId) continue;
      if (!updates[mangaId]) {
        updates[mangaId] = [];
      }
      updates[mangaId].push(chapter);
    }
  }

  useEffect(() => {
    if (chapters?.length > 0) {
      const mangaList = chapters
        .filter((c) => !!c?.manga)
        .map((c) => c.manga as ExtendManga);
      if (mangaList.length > 0) {
        addMangas(mangaList);
      }
    }
  }, [chapters, addMangas]);

  useEffect(() => {
    if (chapters?.length > 0) {
      updateMangaStatistics({
        manga: chapters.filter((c) => !!c?.manga?.id).map((c) => c.manga!.id!),
      });
    }
  }, [chapters, updateMangaStatistics]);

  useEffect(() => {
    if (!total) return;
    setTotalPage(Math.floor(total / Constants.Mangadex.LAST_UPDATES_LIMIT));
  }, [total]);

  return (
    <div className="Module Module-163" id="new-updates">
      <div className="ModuleContent">
        <div className="items">
          {title && (
            <div className="relative">
              <h1 className="my-0 mb-3 flex items-center gap-3 text-[20px] text-web-title">
                <FaClock />
                <span>{title}</span>
              </h1>
            </div>
          )}
          <DataLoader isLoading={isLoading} error={error}>
            <div className={`grid grid-cols-2 gap-[20px] lg:grid-cols-4`}>
              {Object.entries(updates).map(([mangaId, chapterList]) => {
                const manga =
                  mangas[mangaId] || (chapterList[0]?.manga as ExtendManga);
                const coverArt = Utils.Mangadex.getCoverArt(manga);
                const mangaTitle = Utils.Mangadex.getMangaTitle(manga);
                const readedChapters = history[mangaId];
                return (
                  <MangaTile
                    id={mangaId}
                    key={mangaId}
                    thumbnail={coverArt}
                    title={mangaTitle}
                    chapters={chapterList.slice(0, 3).map((chapter) => ({
                      id: chapter.id,
                      title: Utils.Mangadex.getChapterTitle(chapter),
                      subTitle: Utils.Date.formatNowDistance(
                        new Date(chapter.attributes.readableAt),
                      ),
                    }))}
                    readedChapters={readedChapters}
                    mangaStatistic={mangaStatistics[mangaId]}
                  />
                );
              })}
            </div>
          </DataLoader>
        </div>
        <Pagination
          onPageChange={(event) => {
            router.push(`${pathname}?page=${event.selected}#new-updates`);
          }}
          pageCount={totalPage}
          forcePage={page}
          marginPagesDisplayed={1}
          pageRangeDisplayed={2}
        />
      </div>
    </div>
  );
}
