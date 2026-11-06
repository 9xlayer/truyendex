"use client";

import useSWR from "swr/immutable";
import { useMemo } from "react";
import { MangadexApi } from "@/api";
import { ExtendManga, MangaList } from "@/types/mangadex";
import { Utils } from "@/utils";

export default function useSearchManga(
  rawOptions: MangadexApi.Manga.GetSearchMangaRequestOptions,
  { enable }: { enable: boolean } = { enable: true },
) {
  const options = useMemo(() => {
    const opts = { ...rawOptions };
    if (!opts.includes) {
      opts.includes = [MangadexApi.Static.Includes.COVER_ART];
    }
    if (opts.offset && opts.offset > 10000) {
      opts.offset = 10000 - (opts.limit || 10);
    }
    return opts;
  }, [rawOptions]);

  const { data, error, isLoading, mutate } = useSWR(
    enable ? ["search-manga", options] : null,
    () => MangadexApi.Manga.getSearchManga(options),
    {},
  );
  const successData =
    data && data.data.result === "ok" && (data.data as MangaList);

  const mangaList = useMemo(() => {
    if (successData)
      return successData.data.map(
        (m) => Utils.Mangadex.extendRelationship(m) as ExtendManga,
      );
    return [];
  }, [successData]);

  return { data: successData, error, isLoading, mangaList, mutate };
}
