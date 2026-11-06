"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import { useAuth } from "@/hooks/useAuth";
import { Constants } from "@/constants";
import Iconify from "@/components/iconify";

interface ISignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  captchaAnswer: string;
}

export default function SignUpForm() {
  const { signup } = useAuth({
    middleware: "guest",
  });

  const [captchaData, setCaptchaData] = useState<{
    question: string;
    token: string;
  } | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetch("/api/auth/meosss/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptchaData(data);
      }
    } catch {
      toast.error("Không thể tải câu hỏi bảo vệ từ Meosss.");
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ISignupForm>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      captchaAnswer: "",
    },
  });

  const onSubmit: SubmitHandler<ISignupForm> = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!captchaData?.token) {
      toast.error("Chưa có mã captcha. Vui lòng tải lại trang.");
      return;
    }

    try {
      await signup({
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        captcha_token: captchaData.token,
        captcha_answer: data.captchaAnswer.trim(),
      });
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại.");
      fetchCaptcha(); // Refresh captcha on failure
    }
  };

  return (
    <form className="text-start" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="RegisterUsername">
          Tên người dùng (Meosss):
        </label>
        <input
          id="RegisterUsername"
          type="text"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Tên tài khoản (viết liền, không dấu)"
          {...register("username", {
            required: "Vui lòng nhập tên người dùng",
            minLength: { value: 3, message: "Tối thiểu 3 ký tự" },
          })}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="RegisterEmail">
          Địa chỉ Email:
        </label>
        <input
          id="RegisterEmail"
          type="email"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="name@example.com"
          {...register("email", {
            required: "Vui lòng nhập email",
          })}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="RegisterPassword">
          Mật khẩu:
        </label>
        <input
          id="RegisterPassword"
          type="password"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Mật khẩu ít nhất 6 ký tự"
          {...register("password", {
            required: "Vui lòng nhập mật khẩu",
            minLength: { value: 6, message: "Mật khẩu ít nhất 6 ký tự" },
          })}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          className="text-sm font-semibold"
          htmlFor="RegisterConfirmPassword"
        >
          Xác nhận mật khẩu:
        </label>
        <input
          id="RegisterConfirmPassword"
          type="password"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Nhập lại mật khẩu"
          {...register("confirmPassword", {
            required: "Vui lòng xác nhận mật khẩu",
          })}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Captcha question */}
      <div className="mb-5 rounded-md border border-indigo-500/20 bg-indigo-500/5 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-indigo-400">
            Câu hỏi bảo vệ (Chống bot):
          </span>
          <button
            type="button"
            onClick={fetchCaptcha}
            disabled={loadingCaptcha}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
          >
            <Iconify
              icon="mdi:refresh"
              className={loadingCaptcha ? "animate-spin" : ""}
            />
            Đổi câu hỏi
          </button>
        </div>
        <p className="my-2 text-sm font-medium text-slate-200">
          {captchaData?.question ||
            (loadingCaptcha ? "Đang tải câu hỏi..." : "Đang chờ...")}
        </p>
        <input
          type="text"
          className="form-input h-9 w-full rounded border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Nhập câu trả lời (bằng số hoặc chữ)..."
          {...register("captchaAnswer", {
            required: "Vui lòng trả lời câu hỏi bảo vệ",
          })}
        />
        {errors.captchaAnswer && (
          <p className="mt-1 text-xs text-red-500">
            {errors.captchaAnswer.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <button
          disabled={isSubmitting || loadingCaptcha}
          type="submit"
          className="inline-block w-full rounded-md border border-indigo-600 bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:border-indigo-700 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Đang tạo tài khoản Meosss..." : "Tạo tài khoản"}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="me-2 text-slate-400">Đã có tài khoản?</span>
        <Link
          href={Constants.Routes.login}
          className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
