import { MangaDexError } from "@/api/mangadex/util";
import meosssGenres from "@/constants/meosss_genres.json";
import {
  Chapter,
  ChapterList,
  ChapterResponse,
  ExtendManga,
  Manga,
  MangaList,
  MangaResponse,
  Tag,
} from "@/types/mangadex";

const genreIdMap = new Map<
  number,
  { id: number; name: string; slug: string; count: number }
>();
const genreSlugMap = new Map<string, number>();

for (const g of meosssGenres) {
  genreIdMap.set(g.id, g);
  genreSlugMap.set(g.slug, g.id);
  genreSlugMap.set(String(g.id), g.id);
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/meosss";
  }
  return "https://meosss.com";
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .trim();
}

// In-memory cache for manga metadata to avoid repeated calls
const mangaCache = new Map<string, any>();

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // Cache 5 minutes
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new MangaDexError({ message: "Not found", status: 404 });
    }
    if (res.status === 400) {
      try {
        const errJson = await res.json();
        if (errJson?.code === "rest_post_invalid_page_number") {
          return { data: [], headers: res.headers };
        }
      } catch {}
    }
    throw new MangaDexError({
      message: `Meosss API error: ${res.statusText}`,
      status: res.status,
    });
  }
  return {
    data: await res.json(),
    headers: res.headers,
  };
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new MangaDexError({ message: "Chapter not found", status: 404 });
    }
    throw new MangaDexError({
      message: `Failed to load chapter page: ${res.statusText}`,
      status: res.status,
    });
  }
  return await res.text();
}

function mapMeosssToManga(item: any): Manga {
  const mangaId = String(item.id);
  const title = stripHtml(item.title?.rendered || "Không có tiêu đề");
  const description = stripHtml(item.content?.rendered || "");
  const coverUrl =
    item._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    item.featured_image_url ||
    "";
  const genres = item._embedded?.["wp:term"]?.[0] || [];
  const authors = item._embedded?.["wp:term"]?.[1] || [];

  let tags: Tag[] = [];
  if (genres.length > 0) {
    tags = genres.map((g: any) => ({
      id: String(g.id),
      type: "tag",
      attributes: {
        name: { en: stripHtml(g.name), vi: stripHtml(g.name) },
        description: { vi: g.slug || "" },
        group: "genre",
        version: 1,
      },
      relationships: [],
    }));
  } else if (Array.isArray(item.genre) && item.genre.length > 0) {
    tags = item.genre.map((genreId: number) => {
      const g = genreIdMap.get(Number(genreId));
      const gName = g ? g.name : `Thể loại ${genreId}`;
      return {
        id: String(genreId),
        type: "tag",
        attributes: {
          name: { en: gName, vi: gName },
          description: { vi: g?.slug || "" },
          group: "genre",
          version: 1,
        },
        relationships: [],
      };
    });
  }

  const authorName = authors[0]?.name
    ? stripHtml(authors[0].name)
    : "Đang cập nhật";

  const relationships: any[] = [
    {
      id: `cover-${mangaId}`,
      type: "cover_art",
      attributes: {
        fileName: coverUrl
          ? `/api/proxy/image?url=${encodeURIComponent(coverUrl)}&referer=https://meosss.com/`
          : "",
      },
    },
    {
      id: `author-${mangaId}`,
      type: "author",
      attributes: {
        name: authorName,
      },
    },
    {
      id: `artist-${mangaId}`,
      type: "artist",
      attributes: {
        name: authorName,
      },
    },
  ];

  return {
    id: mangaId,
    type: "manga",
    attributes: {
      title: { vi: title, en: title },
      altTitles: [{ vi: title }],
      description: { vi: description, en: description },
      isLocked: false,
      links: null,
      originalLanguage: "vi",
      lastVolume: null,
      lastChapter: null,
      publicationDemographic: null,
      status: "ongoing",
      year: new Date(item.date || Date.now()).getFullYear(),
      contentRating: "safe",
      chapterNumbersResetOnNewVolume: false,
      availableTranslatedLanguages: ["vi"],
      latestUploadedChapter: "",
      tags,
      state: "published",
      version: 1,
      createdAt: item.date || new Date().toISOString(),
      updatedAt: item.modified || new Date().toISOString(),
    },
    relationships,
  };
}

function mapMeosssToChapter(
  item: any,
  mangaId: string,
  mangaSlug?: string,
  mangaData?: ExtendManga,
): Chapter {
  const chapterSlug = item.slug || `chap-${item.number}`;
  const chapterId = `${mangaId}_${chapterSlug}`;
  const chapterNumber = String(item.number ?? "");
  const chapterTitle = item.title ? stripHtml(item.title) : "";

  const relationships: any[] = [
    {
      id: String(mangaId),
      type: "manga",
      attributes: mangaData?.attributes,
    },
  ];

  return {
    id: chapterId,
    type: "chapter",
    attributes: {
      title: chapterTitle,
      volume: null,
      chapter: chapterNumber,
      pages: 0,
      translatedLanguage: "vi",
      uploader: "meosss",
      externalUrl: null,
      version: 1,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.created_at || new Date().toISOString(),
      publishAt: item.created_at || new Date().toISOString(),
      readableAt: item.created_at || new Date().toISOString(),
    },
    relationships,
  };
}

export const MeosssApi = {
  async getManga(idOrSlug: string): Promise<MangaResponse> {
    const isNumeric = /^\d+$/.test(idOrSlug);
    let item: any;

    if (mangaCache.has(idOrSlug)) {
      item = mangaCache.get(idOrSlug);
    } else {
      const url = isNumeric
        ? `${getBaseUrl()}/wp-json/wp/v2/manga/${idOrSlug}?_embed`
        : `${getBaseUrl()}/wp-json/wp/v2/manga?slug=${encodeURIComponent(idOrSlug)}&_embed`;

      const res = await fetchJson(url);
      item = isNumeric ? res.data : res.data?.[0];
      if (!item) {
        throw new MangaDexError({ message: "Manga not found", status: 404 });
      }
      mangaCache.set(String(item.id), item);
      mangaCache.set(item.slug, item);
    }

    return {
      result: "ok",
      response: "entity",
      data: mapMeosssToManga(item),
    };
  },

  async getMangaList(options: any = {}): Promise<MangaList> {
    const limit = Math.min(options.limit || 24, 100);
    const page = options.offset ? Math.floor(options.offset / limit) + 1 : 1;

    let url = `${getBaseUrl()}/wp-json/wp/v2/manga?_embed&per_page=${limit}&page=${page}`;

    let potentialSlug = "";
    if (options.title) {
      let cleanTitle = String(options.title).trim();
      try {
        while (cleanTitle.includes("%")) {
          const decoded = decodeURIComponent(cleanTitle);
          if (decoded === cleanTitle) break;
          cleanTitle = decoded;
        }
      } catch {}
      cleanTitle = cleanTitle.trim();

      // Check if user pasted a URL (e.g. https://meosss.com/truyen/dieu-blues-noi-hem-toi/chap-22/)
      const urlMatch = cleanTitle.match(
        /(?:meosss\.com)?\/truyen\/([^/?#\s]+)/i,
      );
      if (urlMatch) {
        cleanTitle = urlMatch[1];
      }

      // Remove chapter suffixes like /chap-22 or chap 22 or chuong-22
      cleanTitle = cleanTitle
        .replace(/[/_]?(?:chap(?:ter)?|chuong)[-_ ]*\d+.*$/i, "")
        .trim();

      if (/^[a-z0-9-]+$/i.test(cleanTitle) && cleanTitle.includes("-")) {
        potentialSlug = cleanTitle.toLowerCase();
      }

      // Replace hyphens/underscores with space for WordPress full-text search
      const searchParam = cleanTitle.replace(/[-_]+/g, " ").trim();
      if (searchParam) {
        url += `&search=${encodeURIComponent(searchParam)}`;
      }
    }

    // Filter by IDs
    if (options.ids && options.ids.length > 0) {
      const numericIds = options.ids.filter((id: string) => /^\d+$/.test(id));
      if (numericIds.length > 0) {
        url += `&include=${numericIds.join(",")}`;
      }
    }

    // Filter by genres (tags)
    if (options.includedTags && options.includedTags.length > 0) {
      const genreIds = options.includedTags
        .map((tag: string) => {
          if (/^\d+$/.test(tag)) return tag;
          const mappedId = genreSlugMap.get(tag);
          return mappedId ? String(mappedId) : null;
        })
        .filter(Boolean);
      if (genreIds.length > 0) {
        url += `&genre=${genreIds.join(",")}`;
      }
    }

    if (options.excludedTags && options.excludedTags.length > 0) {
      const excludedIds = options.excludedTags
        .map((tag: string) => {
          if (/^\d+$/.test(tag)) return tag;
          const mappedId = genreSlugMap.get(tag);
          return mappedId ? String(mappedId) : null;
        })
        .filter(Boolean);
      if (excludedIds.length > 0) {
        url += `&genre_exclude=${excludedIds.join(",")}`;
      }
    }

    // Filter by author
    if (options.authors && options.authors.length > 0) {
      const authorIds = options.authors.filter((id: string) =>
        /^\d+$/.test(id),
      );
      if (authorIds.length > 0) {
        url += `&author_tax=${authorIds.join(",")}`;
      }
    }

    // Sorting / order
    if (options.order) {
      if (options.order.title) {
        url += `&orderby=title&order=${options.order.title}`;
      } else if (options.order.createdAt) {
        url += `&orderby=date&order=${options.order.createdAt}`;
      } else if (options.order.latestUploadedChapter) {
        url += `&orderby=modified&order=desc`;
      }
    }

    const { data: items, headers } = await fetchJson(url);
    let safeItems = Array.isArray(items) ? items : [];

    // Fallback: If 0 results were found and we had a potential slug, try fetching by slug directly
    if (safeItems.length === 0 && potentialSlug) {
      try {
        const slugUrl = `${getBaseUrl()}/wp-json/wp/v2/manga?_embed&slug=${encodeURIComponent(potentialSlug)}`;
        const { data: slugItems } = await fetchJson(slugUrl);
        if (Array.isArray(slugItems) && slugItems.length > 0) {
          safeItems = slugItems;
        }
      } catch {}
    }

    const total =
      Number(headers?.get?.("x-wp-total")) ||
      (Array.isArray(safeItems) ? safeItems.length : 0);

    // Cache items
    for (const item of safeItems) {
      mangaCache.set(String(item.id), item);
      mangaCache.set(item.slug, item);
    }

    return {
      result: "ok",
      response: "collection",
      data: safeItems.map(mapMeosssToManga),
      limit,
      offset: (page - 1) * limit,
      total,
    };
  },

  async getChapters(mangaIdOrSlug: string): Promise<ChapterList> {
    let mangaId = mangaIdOrSlug;
    let mangaSlug = mangaIdOrSlug;

    if (!/^\d+$/.test(mangaIdOrSlug)) {
      const mangaRes = await this.getManga(mangaIdOrSlug);
      mangaId = mangaRes.data.id;
      const cached = mangaCache.get(mangaId);
      if (cached) mangaSlug = cached.slug;
    } else {
      const cached = mangaCache.get(mangaId);
      if (cached) mangaSlug = cached.slug;
    }

    const url = `${getBaseUrl()}/wp-json/initmanga/v1/chapters?manga_id=${mangaId}&per_page=500`;
    const { data: resData } = await fetchJson(url);
    const items = resData.items || [];

    const chapters: Chapter[] = items.map((item: any) =>
      mapMeosssToChapter(item, mangaId, mangaSlug),
    );

    return {
      result: "ok",
      response: "collection",
      data: chapters,
      limit: items.length,
      offset: 0,
      total: items.length,
    };
  },

  async getMangaAggregate(mangaId: string) {
    const chaptersRes = await this.getChapters(mangaId);
    const chapters = chaptersRes.data || [];

    const volumeChapters: Record<string, any> = {};
    for (const chap of chapters) {
      const chapNum = chap.attributes.chapter || "0";
      volumeChapters[chapNum] = {
        chapter: chapNum,
        id: chap.id,
        others: [],
        count: 1,
      };
    }

    return {
      data: {
        result: "ok",
        volumes: {
          none: {
            volume: "none",
            count: chapters.length,
            chapters: volumeChapters,
          },
        },
      },
    };
  },

  async getChapter(chapterId: string): Promise<ChapterResponse> {
    // chapterId formatted as `${mangaId}_${chapterSlug}`
    const parts = chapterId.split("_");
    const mangaId = parts[0];
    const chapterSlug = parts.slice(1).join("_");

    const mangaRes = await this.getManga(mangaId);
    const chaptersRes = await this.getChapters(mangaId);

    const chapterItem = chaptersRes.data.find(
      (c) =>
        c.id === chapterId ||
        c.id.endsWith(`_${chapterSlug}`) ||
        c.attributes.chapter === chapterSlug,
    );

    if (!chapterItem) {
      throw new MangaDexError({ message: "Chapter not found", status: 404 });
    }

    chapterItem.relationships = [
      {
        id: mangaId,
        type: "manga",
        related: "main_story",
        attributes: mangaRes.data.attributes,
      } as any,
    ];

    return {
      result: "ok",
      response: "entity",
      data: chapterItem,
    };
  },

  async getChapterPages(chapterId: string) {
    const parts = chapterId.split("_");
    const mangaId = parts[0];
    const chapterSlug = parts.slice(1).join("_");

    // Resolve manga slug
    let mangaSlug = mangaId;
    const cached = mangaCache.get(mangaId);
    if (cached?.slug) {
      mangaSlug = cached.slug;
    } else {
      const mangaRes = await this.getManga(mangaId);
      const c = mangaCache.get(mangaRes.data.id);
      if (c?.slug) mangaSlug = c.slug;
    }

    const chapterUrl = `${getBaseUrl()}/truyen/${mangaSlug}/${chapterSlug}/`;
    const html = await fetchHtml(chapterUrl);

    let snippet = html;
    const matchContent = html.match(
      /<(?:div|article)[^>]*id=["']?chapter-content["']?[^>]*>([\s\S]*?)<\/(?:div|article)>/i,
    );
    if (matchContent) {
      snippet = matchContent[1];
    } else {
      const idx = html.search(/id=["']?chapter-content/i);
      if (idx !== -1) snippet = html.slice(idx);
    }

    const regex =
      /<img[^>]+(?:data-original-src|src)=["']?(https:\/\/[^"'\s>]+\.(?:webp|jpg|jpeg|png)(?:\?[^"'\s>]*)?)["'\s>]/gi;

    const rawImages: string[] = [];
    let match;
    while ((match = regex.exec(snippet)) !== null) {
      if (!rawImages.includes(match[1])) {
        rawImages.push(match[1]);
      }
    }

    // Filter out blacklisted ad patterns
    const cleanImages = rawImages.filter(
      (img) =>
        !/banner|quang-cao|quangcao|fb88|shbet|jun88|kubet|custom-logo|site-logo|avatar/i.test(
          img,
        ),
    );

    // Wrap in local image proxy
    const proxiedImages = cleanImages.map(
      (img) =>
        `/api/proxy/image?url=${encodeURIComponent(img)}&referer=https://meosss.com/`,
    );

    return {
      data: {
        result: "ok",
        baseUrl: "",
        chapter: {
          hash: "",
          data: proxiedImages,
          dataSaver: proxiedImages,
        },
      },
    };
  },

  async getLatestChapters(options: any = {}): Promise<ChapterList> {
    const mangaListRes = await this.getMangaList({
      limit: options.limit || 24,
      offset: options.offset || 0,
    });

    const chapters: Chapter[] = [];

    // For each manga, fetch its top chapter
    await Promise.all(
      mangaListRes.data.slice(0, 16).map(async (manga) => {
        try {
          const chapRes = await this.getChapters(manga.id);
          if (chapRes.data.length > 0) {
            const latest = chapRes.data[0];
            latest.relationships = [
              {
                id: manga.id,
                type: "manga",
                related: "main_story",
                attributes: manga.attributes,
              } as any,
            ];
            chapters.push(latest);
          }
        } catch {
          // ignore individual failures
        }
      }),
    );

    return {
      result: "ok",
      response: "collection",
      data: chapters,
      limit: chapters.length,
      offset: 0,
      total: chapters.length,
    };
  },

  async getGenres(): Promise<{ data: Tag[] }> {
    const tags: Tag[] = meosssGenres.map((g) => ({
      id: String(g.id),
      type: "tag",
      attributes: {
        name: { en: g.name, vi: g.name },
        description: { vi: g.slug },
        group: "genre",
        version: 1,
      },
      relationships: [],
    }));

    return { data: tags };
  },
};
