import useSWR from "swr/immutable";
import { MangadexApi } from "@/api";
import { useSettingsContext } from "@/contexts/settings";

export default function useChapterPages(chapterId: string | null) {
  const { dataSaver } = useSettingsContext();
  const { data, isLoading, error } = useSWR(
    chapterId ? ["chapter-pages", chapterId] : null,
    () =>
      MangadexApi.AtHome.getAtHomeServerChapterId(chapterId!, {
        forcePort443: false,
      }),
  );
  const successData =
    data &&
    (data.data as MangadexApi.AtHome.GetAtHomeServerChapterIdResponse)?.chapter;
  const pages = successData
    ? (dataSaver ? successData.dataSaver : successData.data).map(
        (originalData) => {
          if (
            originalData.startsWith("http://") ||
            originalData.startsWith("https://") ||
            originalData.startsWith("/")
          ) {
            return originalData;
          }
          const baseUrl = (
            data.data as MangadexApi.AtHome.GetAtHomeServerChapterIdResponse
          ).baseUrl;
          const folder = dataSaver ? "data-saver" : "data";
          return `${baseUrl}/${folder}/${successData.hash}/${originalData}`;
        },
      )
    : [];

  return { pages, isLoading, error };
}
