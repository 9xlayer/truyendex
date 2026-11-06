"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { useAuth } from "@/hooks/useAuth";
import { Constants } from "@/constants";
import Iconify from "@/components/iconify";

interface ILoginForm {
  login: string;
  password: string;
  remember: boolean;
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "sync">("sync");
  const [cookieInput, setCookieInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { login, syncCookie } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated:
      searchParams.get("redirectUrl") || Constants.Routes.nettrom.index,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ILoginForm>({
    defaultValues: {
      login: "",
      password: "",
      remember: true,
    },
  });

  const onLoginSubmit = async (data: ILoginForm) => {
    setLoginError("");
    try {
      await login({
        log: data.login,
        pwd: data.password,
        remember: data.remember,
      });
    } catch (error: any) {
      if (error?.requiresCookieSync) {
        setLoginError(error.message);
        setActiveTab("sync");
        toast.warn("Vui lòng đồng bộ tài khoản bằng Cookie Meosss bên dưới.");
      } else {
        toast.error(error.message || "Đăng nhập thất bại.");
        setLoginError(error.message || "Đăng nhập thất bại.");
      }
    }
  };

  const onCookieSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookieInput.trim()) {
      toast.error("Vui lòng dán chuỗi cookie Meosss.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncCookie(cookieInput.trim());
    } catch (error: any) {
      toast.error(error.message || "Đồng bộ thất bại");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="text-start">
      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          className={`flex-1 pb-3 text-center font-semibold transition-colors ${
            activeTab === "sync"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          onClick={() => setActiveTab("sync")}
        >
          Đồng bộ Meosss (Khuyên dùng)
        </button>
        <button
          type="button"
          className={`flex-1 pb-3 text-center font-semibold transition-colors ${
            activeTab === "login"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Đăng nhập trực tiếp
        </button>
      </div>

      {loginError && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500 dark:text-amber-400">
          {loginError}
        </div>
      )}

      {activeTab === "sync" ? (
        <form onSubmit={onCookieSync}>
          <div className="mb-4 rounded-md border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-slate-300">
            <h4 className="mb-2 font-bold text-indigo-400">
              Cách đồng bộ tài khoản Meosss:
            </h4>
            <ol className="list-inside list-decimal space-y-1.5 text-xs text-slate-400">
              <li>
                Đăng nhập tài khoản của bạn trên{" "}
                <a
                  href="https://meosss.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-400 underline hover:text-indigo-300"
                >
                  meosss.com
                </a>
              </li>
              <li>
                Mở DevTools (nhấn <b>F12</b>) &rarr; chọn tab <b>Application</b>{" "}
                (hoặc <b>Lưu trữ</b>) &rarr; mục <b>Cookies</b> &rarr;{" "}
                <code>https://meosss.com</code>
              </li>
              <li>
                Tìm cookie có tên bắt đầu bằng <code>wordpress_logged_in_</code>{" "}
                và copy toàn bộ giá trị (hoặc copy tất cả cookie), sau đó dán
                vào ô bên dưới:
              </li>
            </ol>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold" htmlFor="MeosssCookie">
              Cookie Meosss:
            </label>
            <textarea
              id="MeosssCookie"
              rows={3}
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              className="form-input mt-2 w-full rounded border border-gray-200 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
              placeholder="wordpress_logged_in_0aba...=... hoặc dán toàn bộ cookie"
            />
          </div>

          <div className="mb-4">
            <button
              disabled={isSyncing}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:border-indigo-700 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Iconify
                icon="mdi:sync"
                className={isSyncing ? "animate-spin" : ""}
              />
              {isSyncing
                ? "Đang xác thực với Meosss..."
                : "Đồng bộ tài khoản ngay"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit(onLoginSubmit)}>
          <div className="mb-4">
            <label className="text-sm font-semibold" htmlFor="LoginUsername">
              Tên đăng nhập hoặc Email Meosss:
            </label>
            <input
              id="LoginUsername"
              type="text"
              className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
              placeholder="norashing@yopmail.com hoặc username"
              {...register("login", {
                required: "Vui lòng nhập tên đăng nhập hoặc email",
              })}
            />
            {errors.login && (
              <p className="mt-1 text-xs text-red-500">
                {errors.login.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold" htmlFor="LoginPassword">
              Mật khẩu Meosss:
            </label>
            <input
              id="LoginPassword"
              type="password"
              className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
              placeholder="******"
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <input
                className="form-checkbox me-2 rounded border-gray-200 text-indigo-600 focus:ring-0 dark:border-gray-800"
                type="checkbox"
                id="RememberMe"
                {...register("remember")}
              />
              <label className="text-xs text-slate-400" htmlFor="RememberMe">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a
              href="https://meosss.com/ms-login"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-indigo-500"
            >
              Quên mật khẩu?
            </a>
          </div>

          <div className="mb-4">
            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-block w-full rounded-md border border-indigo-600 bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:border-indigo-700 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang kết nối..." : "Đăng nhập Meosss"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="me-2 text-slate-400">Chưa có tài khoản?</span>
        <Link
          href={Constants.Routes.signup}
          className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Đăng ký tài khoản Meosss mới
        </Link>
      </div>
    </div>
  );
}
