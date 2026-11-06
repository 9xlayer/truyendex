"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { MangadexApi } from "@/api";
import { ExtendChapter } from "@/types/mangadex";
import { Constants } from "@/constants";
import { Utils } from "@/utils";

export const chaptersPerPage = Constants.Mangadex.LAST_UPDATES_LIMIT;

export default function useLastUpdates(options: {
  page: number;
  groupId?: string;
  filteredLanguages?: string[];
  filteredContentRating?: string[];
  originLanguages?: string[];
}) {
  const { page, groupId } = options;

  let offset = chaptersPerPage * page;
  if (offset > 10000) {
    offset = 10000 - chaptersPerPage;
  }
  const { data, isLoading, error } = useSWR(
    ["last-updates", page, groupId],
    () =>
      MangadexApi.Chapter.getChapter({
        includes: ["scanlation_group"],
        translatedLanguage: options.filteredLanguages || ["vi"],
        contentRating: options.filteredContentRating
          ? (options.filteredContentRating as MangadexApi.Static.MangaContentRating[])
          : [
              MangadexApi.Static.MangaContentRating.SAFE,
              MangadexApi.Static.MangaContentRating.SUGGESTIVE,
              MangadexApi.Static.MangaContentRating.EROTICA,
            ],
        order: {
          readableAt: MangadexApi.Static.Order.DESC,
        },
        limit: chaptersPerPage,
        offset,
        groups: groupId ? [groupId] : undefined,
        originalLanguage: options.originLanguages || [],
      }),
  );

  const chapters = useMemo(() => {
    const rawList = data?.data?.data;
    if (!rawList || !Array.isArray(rawList)) return [];
    return rawList.map(
      (c) => Utils.Mangadex.extendRelationship(c) as ExtendChapter,
    );
  }, [data]);

  const total = data?.data?.total || chapters.length;

  return {
    chapters,
    isLoading,
    error,
    total,
  };
}
