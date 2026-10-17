import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, AlertCircle, FileQuestion } from "lucide-react";

export default function NotFound({
  type = "404",
  errorCode,
  customTitle,
  customMessage,
  redirectPath = "/login",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(4);

  const currentType = location.state?.type || type;

  const contentMap = {
    404: {
      code: "۴۰۴",
      title: customTitle || "صفحه مورد نظر یافت نشد",
      desc:
        customMessage ||
        "آدرس وارد شده معتبر نیست یا صفحه مورد نظر به آدرس دیگری منتقل شده است.",
      icon: <FileQuestion className="w-6 h-6 text-slate-500" />,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    expired: {
      code: "۴۰۱",
      title: customTitle || "نشست شما پایان یافته است",
      desc:
        customMessage ||
        "به دلیل ورود از دستگاه دیگر یا پایان مهلت نشست، لطفاً مجدداً وارد شوید.",
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
  };

  const activeContent = contentMap[currentType] || contentMap["404"];
  const displayCode = errorCode || activeContent.code;

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate(redirectPath, { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, redirectPath]);

  return (
    <div
      className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 antialiased"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 text-center">
        {/* لوگوی مرکز */}
        <div className="flex justify-center mb-5">
          <img
            src="https://api.report-tehranep.site/images/logo.png"
            alt="مرکز آریتمی تهران"
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* آیکون وضعیت */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            {activeContent.icon}
          </div>
        </div>

        {/* کد خطا به‌صورت تگ رسمی و کوچک */}
        <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border mb-3">
          کد خطا: {displayCode}
        </div>

        {/* عنوان و توضیحات کاملاً اداری و خوانا */}
        <h1 className="text-base font-bold text-slate-900 mb-2">
          {activeContent.title}
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed mb-6 px-1">
          {activeContent.desc}
        </p>

        {/* دکمه ورود مجدد */}
        <button
          onClick={() => navigate(redirectPath, { replace: true })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>ورود به سامانه</span>
        </button>

        {/* شمارشگر آرام و مینیمال */}
        <p className="text-[11px] text-slate-400 mt-3 font-normal">
          انتقال خودکار تا{" "}
          <span className="font-semibold text-slate-600 font-mono">
            {timeLeft}
          </span>{" "}
          ثانیه دیگر...
        </p>

        {/* فوتر مینیمال */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          مرکز تخصصی آریتمی قلب تهران
        </div>
      </div>
    </div>
  );
}
