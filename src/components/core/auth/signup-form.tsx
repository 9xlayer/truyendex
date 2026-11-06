"use client";

import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import { useAuth } from "@/hooks/useAuth";
import { Constants } from "@/constants";

interface ISignupForm {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpForm() {
  const { signup } = useAuth({
    middleware: "guest",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ISignupForm>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<ISignupForm> = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await signup({
        username: data.username.trim(),
        password: data.password,
      });
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại.");
    }
  };

  return (
    <form className="text-start" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="RegisterUsername">
          Tên tài khoản:
        </label>
        <input
          id="RegisterUsername"
          type="text"
          autoComplete="username"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Tên tài khoản (viết liền hoặc có dấu cách)"
          {...register("username", {
            required: "Vui lòng nhập tên tài khoản",
            minLength: {
              value: 3,
              message: "Tên tài khoản phải có ít nhất 3 ký tự",
            },
          })}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="RegisterPassword">
          Mật khẩu:
        </label>
        <input
          id="RegisterPassword"
          type="password"
          autoComplete="new-password"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Ít nhất 6 ký tự"
          {...register("password", {
            required: "Vui lòng nhập mật khẩu",
            minLength: {
              value: 6,
              message: "Mật khẩu phải có ít nhất 6 ký tự",
            },
          })}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold" htmlFor="ConfirmPassword">
          Xác nhận mật khẩu:
        </label>
        <input
          id="ConfirmPassword"
          type="password"
          autoComplete="new-password"
          className="form-input mt-2 h-10 w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-0 dark:border-gray-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-600"
          placeholder="Nhập lại mật khẩu"
          {...register("confirmPassword", {
            required: "Vui lòng nhập lại mật khẩu",
          })}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <button
          disabled={isSubmitting}
          type="submit"
          className="inline-block w-full rounded-md border border-indigo-600 bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:border-indigo-700 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
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
