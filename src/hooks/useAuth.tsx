import useSWR from "swr";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "nextjs-toploader/app";

import { GetUserResponse, UserResponse } from "@/types";
import { Constants } from "@/constants";

import { useCookies } from "./useCookies";

export const useAuth = ({
  middleware,
  redirectIfAuthenticated,
  redirectIfNotAuthenticated,
}: {
  middleware?: string;
  redirectIfAuthenticated?: string;
  redirectIfNotAuthenticated?: string;
} = {}) => {
  const router = useRouter();

  const userIdValues = useCookies<number>("userId", 0, 0, {
    daysUntilExpiration: 30,
  });

  const { data: user, mutate } = useSWR<UserResponse | null>(
    "/api/auth/me",
    async () => {
      try {
        // Try local SQLite session first
        const localRes = await fetch("/api/auth/local/me");
        if (localRes.ok) {
          const localData: GetUserResponse = await localRes.json();
          if (localData?.user) {
            userIdValues.setState(localData.user.id);
            return localData.user;
          }
        }

        // Fallback to Meosss session if present
        const res = await fetch("/api/auth/meosss/me");
        if (res.ok) {
          const data: GetUserResponse = await res.json();
          if (data?.user) {
            userIdValues.setState(data.user.id);
            return data.user;
          }
        }
      } catch {}
      userIdValues.resetState();
      return null;
    },
  );

  const signup = async (props: {
    username: string;
    email?: string;
    password: string;
    captcha_token?: string;
    captcha_answer?: string;
  }) => {
    const res = await fetch("/api/auth/local/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: props.username,
        password: props.password,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Đăng ký không thành công");
    }
    toast.success(data.message || "Đăng ký thành công!");
    await mutate();
    return data;
  };

  const login = async (props: {
    log: string;
    pwd: string;
    remember?: boolean;
  }) => {
    const res = await fetch("/api/auth/local/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: props.log,
        password: props.pwd,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      // If local login failed, check if user wanted meosss login or return error
      throw new Error(data.error || "Đăng nhập không thành công");
    }
    toast.success("Đăng nhập thành công!");
    await mutate();
    return data;
  };

  const syncCookie = async (cookie: string) => {
    const res = await fetch("/api/auth/meosss/sync-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookie }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Đồng bộ cookie thất bại");
    }
    toast.success(data.message || "Đồng bộ tài khoản thành công!");
    await mutate();
    return data;
  };

  const logout = useCallback(async () => {
    await Promise.allSettled([
      fetch("/api/auth/local/logout", { method: "POST" }),
      fetch("/api/auth/meosss/logout", { method: "POST" }),
    ]);
    userIdValues.resetState();
    toast.info("Đã đăng xuất");
    await mutate(null, false);
    router.push(Constants.Routes.nettrom.index);
  }, [mutate, router, userIdValues]);

  const forgotPassword = async (_data: { email: string }) => {
    toast.info(
      "Vui lòng truy cập https://meosss.com để đặt lại mật khẩu Meosss",
    );
  };

  const resetPassword = async (_props?: any) => {};
  const resendEmailVerification = async (_data?: any) => {};
  const changePassword = async (_data?: any) => {};

  useEffect(() => {
    if (middleware === "guest" && user) {
      toast.info("Đã đăng nhập, chuyển hướng...");
      router.push(redirectIfAuthenticated || Constants.Routes.nettrom.index);
    }

    if (middleware === "auth" && user === null) {
      router.push(redirectIfNotAuthenticated || Constants.Routes.login);
    }
  }, [!!user, middleware, redirectIfAuthenticated, redirectIfNotAuthenticated]);

  return {
    user,
    signup,
    login,
    syncCookie,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
    changePassword,
    mutate,
  };
};
