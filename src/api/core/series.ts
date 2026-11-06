export const followOrUnfollow = async (
  seriesId: string,
  extra?: { title?: string; cover?: string },
) => {
  const res = await fetch("/api/auth/local/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      manga_id: seriesId,
      manga_title: extra?.title,
      cover: extra?.cover,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Không thể theo dõi truyện");
  }
  return data;
};

export const checkInfo = async (seriesId: string) => {
  try {
    const res = await fetch("/api/auth/local/check-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_uuid: seriesId }),
    });
    if (!res.ok) {
      return { followed: null, comment_count: 0 };
    }
    return await res.json();
  } catch {
    return { followed: null, comment_count: 0 };
  }
};

export const getHomepageSeries = async (_params: {
  limit: number;
  page?: number;
}) => {
  return { data: [] } as any;
};
