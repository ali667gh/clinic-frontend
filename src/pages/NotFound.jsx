import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity, ArrowRight, ShieldAlert, HeartCrack } from "lucide-react";

export default function NotFound({
  type = "404", // '404' یا 'expired' یا 'unauthorized'
  customTitle,
  customMessage,
  redirectPath = "/login",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(4);

  // تشخیص نوع خطا از روی state پاس‌داده‌شده در navigate (در صورت وجود)
  const currentType = location.state?.type || type;

  const contentMap = {
    404: {
      badge: "خطای ۴۰۴",
      title: customTitle || "صفحه مورد نظر یافت نشد!",
      desc:
        customMessage ||
        "متأسفانه صفحه‌ای که به دنبال آن بودید جابه‌جا شده یا وجود ندارد.",
      icon: <HeartCrack className="w-12 h-12 text-rose-500 animate-pulse" />,
      badgeColor: "bg-rose-50 text-rose-600 border-rose-200",
    },
    expired: {
      badge: "نشست منقضی شده",
      title: customTitle || "اعتبار صفحه به پایان رسیده است",
      desc:
        customMessage ||
        "به دلیل عدم فعالیت یا پایان زمان دسترسی، جهت حفظ امنیت اطلاعات پزشکی باید مجدداً وارد شوید.",
      icon: <ShieldAlert className="w-12 h-12 text-amber-500 animate-bounce" />,
      badgeColor: "bg-amber-50 text-amber-600 border-amber-200",
    },
  };

  const activeContent = contentMap[currentType] || contentMap["404"];

  // مدیریت تایمر ۴ ثانیه‌ای
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

  // درصد پیشرفت خط تایم‌لاین (از ۱۰۰٪ به ۰٪ در طول ۴ ثانیه)
  const progressPercent = (timeLeft / 4) * 100;

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* نوار رنگی بالای کارت شبیه نوار مانیتور قلب */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-rose-500 to-indigo-600" />

        {/* لوگوی مرکز آریتمی تهران */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50/80 border border-blue-100 p-3 shadow-inner">
            <img
              src="https://api.report-tehranep.site/images/logo.png"
              alt="مرکز آریتمی تهران"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* بج خطا */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 shadow-sm mx-auto">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${activeContent.badgeColor}`}
          >
            {activeContent.badge}
          </span>
        </div>

        {/* انیمیشن ریتم قلب و آیکون وضعیت */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner mb-3">
            {activeContent.icon}
          </div>

          {/* موج خط ECG نمادین قلب */}
          <div className="flex items-center gap-1 text-blue-500 opacity-60">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-slate-400">
              ARRHYTHMIA CARE
            </span>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* عنوان و توضیحات */}
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {activeContent.title}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {activeContent.desc}
        </p>

        {/* بخش تایم‌لاین ۴ ثانیه‌ای */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-2">
            <span>انتقال خودکار به صفحه ورود:</span>
            <span className="text-blue-600 font-bold font-mono text-sm">
              {timeLeft} ثانیه
            </span>
          </div>

          {/* نوار متحرک پروگرس‌بار */}
          <div
            className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
            dir="ltr"
          >
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* دکمه بازگشت سریع */}
        <button
          onClick={() => navigate(redirectPath, { replace: true })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99]"
        >
          <span>بازگشت سریع به صفحه ورود</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          مرکز تخصصی آریتمی و الکتروفیزیولوژی قلب تهران
        </div>
      </div>
    </div>
  );
}
