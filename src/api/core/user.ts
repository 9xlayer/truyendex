import { ReadListResponse } from "@/types";

export const getReadList = async (_query: { page?: number } = {}) => {
  try {
    const res = await fetch("/api/auth/meosss/following");
    if (!res.ok) {
      return {
        current_page: 1,
        from: 0,
        last_page: 1,
        per_page: 10,
        total: 0,
        to: 0,
        data: [],
      } as ReadListResponse;
    }
    return (await res.json()) as ReadListResponse;
  } catch {
    return {
      current_page: 1,
      from: 0,
      last_page: 1,
      per_page: 10,
      total: 0,
      to: 0,
      data: [],
    } as ReadListResponse;
  }
};

export const syncReadList = async (_body: {
  source: string;
  ids: string[];
}): Promise<any> => {
  return null;
};

export const changePassword = async (_body: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => {
  return { success: true };
};

export const changeName = async (_body: { name: string }) => {
  return { success: true };
};

export const changeAvatar = async (_file: File) => {
  return { success: true };
};
