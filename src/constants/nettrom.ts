import { Tag } from "@/types/mangadex";
import meosssGenres from "./meosss_genres.json";

export class NettromConstants {
  readonly MANGA_COVER_RATIO = 2 / 3;
  tags: Tag[] = meosssGenres.map((g) => ({
    id: String(g.id),
    type: "tag",
    attributes: {
      name: {
        en: g.name,
        vi: g.name,
      },
      description: {
        vi: g.slug,
      },
      group: "genre",
      version: 1,
    },
    relationships: [],
  }));

  languages = [
    {
      name: "Nhật Bản",
      code: "ja",
    },
    {
      name: "Trung Quốc",
      code: "zh",
    },
    {
      name: "Đài Loan",
      code: "zh-hk",
    },
    {
      name: "Hàn Quốc",
      code: "ko",
    },
    {
      name: "Anh",
      code: "en",
    },
    {
      name: "Việt Nam",
      code: "vi",
    },
    {
      name: "Afrikaans",
      code: "af",
    },
    {
      name: "Albanian",
      code: "sq",
    },
    {
      name: "Arabic",
      code: "ar",
    },
    {
      name: "Azerbaijani",
      code: "az",
    },
    {
      name: "Basque",
      code: "eu",
    },
    {
      name: "Belarusian",
      code: "be",
    },
    {
      name: "Bengali",
      code: "bn",
    },
    {
      name: "Bulgarian",
      code: "bg",
    },
    {
      name: "Burmese",
      code: "my",
    },
    {
      name: "Catalan",
      code: "ca",
    },
    {
      name: "Chuvash",
      code: "cv",
    },
    {
      name: "Croatian",
      code: "hr",
    },
    {
      name: "Czech",
      code: "cs",
    },
    {
      name: "Danish",
      code: "da",
    },
    {
      name: "Dutch",
      code: "nl",
    },
    {
      name: "Esperanto",
      code: "eo",
    },
    {
      name: "Estonian",
      code: "et",
    },
    {
      name: "Filipino",
      code: "fil",
    },
    {
      name: "Finnish",
      code: "fi",
    },
    {
      name: "French",
      code: "fr",
    },
    {
      name: "Georgian",
      code: "ka",
    },
    {
      name: "German",
      code: "de",
    },
    {
      name: "Greek",
      code: "el",
    },
    {
      name: "Hebrew",
      code: "he",
    },
    {
      name: "Hindi",
      code: "hi",
    },
    {
      name: "Hungarian",
      code: "hu",
    },
    {
      name: "Indonesian",
      code: "id",
    },
    {
      name: "Irish",
      code: "ga",
    },
    {
      name: "Italian",
      code: "it",
    },
    {
      name: "Javanese",
      code: "jv",
    },
    {
      name: "Kazakh",
      code: "kk",
    },
    {
      name: "Latin",
      code: "la",
    },
    {
      name: "Lithuanian",
      code: "lt",
    },
    {
      name: "Malay",
      code: "ms",
    },
    {
      name: "Mongolian",
      code: "mn",
    },
    {
      name: "Nepali",
      code: "ne",
    },
    {
      name: "Norwegian",
      code: "no",
    },
    {
      name: "Persian",
      code: "fa",
    },
    {
      name: "Polish",
      code: "pl",
    },
    {
      name: "Portuguese",
      code: "pt",
    },
    {
      name: "Portuguese (Brazil)",
      code: "pt-br",
    },
    {
      name: "Romanian",
      code: "ro",
    },
    {
      name: "Russian",
      code: "ru",
    },
    {
      name: "Serbian",
      code: "sr",
    },
    {
      name: "Slovak",
      code: "sk",
    },
    {
      name: "Slovenian",
      code: "sl",
    },
    {
      name: "Spanish",
      code: "es",
    },
    {
      name: "Spanish (Latin America)",
      code: "es-la",
    },
    {
      name: "Swedish",
      code: "sv",
    },
    {
      name: "Tamil",
      code: "ta",
    },
    {
      name: "Telugu",
      code: "te",
    },
    {
      name: "Thai",
      code: "th",
    },
    {
      name: "Turkish",
      code: "tr",
    },
    {
      name: "Ukrainian",
      code: "uk",
    },
    {
      name: "Urdu",
      code: "ur",
    },
    {
      name: "Uzbek",
      code: "uz",
    },
  ];
}
