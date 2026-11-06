export const followOrUnfollow = async (seriesId: string) => {
  const res = await fetch("/api/auth/meosss/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ manga_id: seriesId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Không thể theo dõi truyện");
  }
  return data;
};

export const checkInfo = async (seriesId: string) => {
  try {
    const res = await fetch("/api/auth/meosss/check-info", {
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
