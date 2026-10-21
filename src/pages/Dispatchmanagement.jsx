import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Send,
  Search,
  RefreshCw,
  Loader2,
  Clock,
  Edit,
  Users,
  FileText,
  FolderArchive,
  Inbox,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

// ───────────────────────── ابزارهای کمکی ─────────────────────────

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
};

// یکسان‌سازی اعداد فارسی/عربی و حروف عربی برای جستجو
const normalize = (value) =>
  String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .trim()
    .toLowerCase();

const extractList = (res) =>
  Array.isArray(res?.data?.data)
    ? res.data.data
    : Array.isArray(res?.data)
      ? res.data
      : [];

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "هم‌اکنون";
  if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("fa-IR")} روز پیش`;
};

const matchesSearch = (item, q) => {
  if (!q) return true;
  return [
    item.patient_name || item.full_name,
    item.file_number,
    item.national_code,
    item.mobile,
  ].some((v) => normalize(v).includes(q));
};

const errorMessage = (error, fallback) => {
  if (error?.response?.status === 429) {
    return "تعداد درخواست‌ها زیاد است؛ لطفاً چند لحظه بعد دوباره تلاش کنید.";
  }
  return error?.response?.data?.message || fallback;
};

// ───────────────────────── کامپوننت اصلی ─────────────────────────

export default function DispatchManagement() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const isAdmin = user.role === "admin";

  const [activeTab, setActiveTab] = useState("recent");
  const [recent, setRecent] = useState([]);
  const [edited, setEdited] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingEdited, setLoadingEdited] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState({});

  // ── دریافت داده‌ها ──
  const fetchRecent = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingRecent(true);
      const res = await api.get("/dispatch/recent");
      setRecent(extractList(res));
    } catch (error) {
      console.error("خطا در دریافت جوابدهی‌های اخیر:", error);
      toast.error(errorMessage(error, "خطا در دریافت لیست جوابدهی‌های اخیر"));
    } finally {
      if (!silent) setLoadingRecent(false);
    }
  }, []);

  const fetchEdited = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingEdited(true);
      const res = await api.get("/dispatch/edited-patients");
      setEdited(extractList(res));
    } catch (error) {
      console.error("خطا در دریافت بیماران ویرایش‌شده:", error);
      toast.error(errorMessage(error, "خطا در دریافت لیست بیماران ویرایش‌شده"));
    } finally {
      if (!silent) setLoadingEdited(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
    fetchEdited();
  }, [fetchRecent, fetchEdited]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  const handleRefresh = () => {
    fetchRecent();
    fetchEdited();
  };

  // ── ارسال دوباره‌ی لینک ──
  const setSendingFlag = (key, value) =>
    setSending((prev) => {
      const next = { ...prev };
      if (value) next[key] = true;
      else delete next[key];
      return next;
    });

  const handleResendArchive = async (item) => {
    const key = `a-${item.id}`;
    if (sending[key]) return;

    setSendingFlag(key, true);
    try {
      const res = await api.post(`/dispatch/archives/${item.id}/resend`);
      toast.success(res.data?.message || "لینک جوابدهی ارسال شد");

      const resentAt = res.data?.data?.resent_at || new Date().toISOString();
      setRecent((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? {
                ...r,
                resend_count: (r.resend_count || 0) + 1,
                last_resent_at: resentAt,
              }
            : r,
        ),
      );

      // ممکن است بیمار همین پرونده از لیست ویرایش‌شده‌ها خارج شده باشد
      fetchEdited(true);
    } catch (error) {
      console.error("خطا در ارسال دوباره لینک:", error);
      toast.error(errorMessage(error, "خطا در ارسال دوباره لینک"));
    } finally {
      setSendingFlag(key, false);
    }
  };

  const handleResendPatient = async (item) => {
    const key = `p-${item.id}`;
    if (sending[key]) return;

    setSendingFlag(key, true);
    try {
      const res = await api.post(`/dispatch/patients/${item.id}/resend`);
      toast.success(res.data?.message || "لینک جوابدهی ارسال شد");

      // بیمار پس از ارسال از لیست خارج می‌شود
      setEdited((prev) => prev.filter((p) => p.id !== item.id));
      fetchRecent(true);
    } catch (error) {
      console.error("خطا در ارسال دوباره لینک بیمار:", error);
      toast.error(errorMessage(error, "خطا در ارسال دوباره لینک"));
    } finally {
      setSendingFlag(key, false);
    }
  };

  // ── فیلتر و صفحه‌بندی ──
  const query = normalize(search);
  const sourceList = activeTab === "recent" ? recent : edited;
  const isLoading = activeTab === "recent" ? loadingRecent : loadingEdited;

  const filtered = useMemo(
    () => sourceList.filter((item) => matchesSearch(item, query)),
    [sourceList, query],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const tabs = [
    {
      key: "recent",
      label: "لینک بیماران اخیر (۲۴ ساعت)",
      icon: Clock,
      count: recent.length,
    },
    {
      key: "edited",
      label: "بیماران ویرایش‌شده",
      icon: Edit,
      count: edited.length,
    },
  ];

  const renderResendButton = (key, onClick) => {
    const isSending = Boolean(sending[key]);
    return (
      <Button
        type="button"
        size="sm"
        onClick={onClick}
        disabled={isSending}
        className="gap-1.5 bg-sky-600 text-white hover:bg-sky-700"
      >
        {isSending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            در حال ارسال...
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            ارسال دوباره لینک
          </>
        )}
      </Button>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* سربرگ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-10 w-10 shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                مدیریت ارسالی‌ها
              </h1>
              <p className="text-xs text-slate-500">
                ارسال دوباره‌ی لینک جوابدهی در صورت نرسیدن پیامک
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/patients")}
              className="gap-1.5"
            >
              <Users className="h-4 w-4" />
              مدیریت بیماران
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/results")}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              ثبت جوابدهی
            </Button>
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/archive")}
                className="gap-1.5"
              >
                <FolderArchive className="h-4 w-4" />
                بایگانی و سوابق
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loadingRecent || loadingEdited}
              className="gap-1.5"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingRecent || loadingEdited ? "animate-spin" : ""
                }`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count.toLocaleString("fa-IR")}
                </span>
              </button>
            );
          })}
        </div>

        {/* جستجو */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو با نام، شماره پرونده، شماره موبایل یا کد ملی..."
                className="bg-white pr-10 pl-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  title="پاک کردن جستجو"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* جدول */}
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {activeTab === "recent" ? (
                  <>
                    <Clock className="h-4 w-4 text-slate-500" />
                    جوابدهی‌های ثبت‌شده در ۲۴ ساعت گذشته
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 text-slate-500" />
                    بیماران ویرایش‌شده در انتظار ارسال لینک
                  </>
                )}
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === "recent"
                  ? "لینک هر جوابدهی را می‌توانید دوباره برای بیمار ارسال کنید."
                  : "بیمارانی که پس از ثبت جوابدهی، اطلاعاتشان ویرایش شده است. پس از ارسال لینک از این لیست خارج می‌شوند."}
              </p>
            </div>

            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {filtered.length.toLocaleString("fa-IR")} مورد
            </span>
          </CardHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="mb-3 h-6 w-6 animate-spin text-sky-600" />
              <p className="text-sm text-slate-500">در حال دریافت لیست...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-slate-400">
              <Inbox className="h-8 w-8" />
              {search
                ? "موردی با این مشخصات یافت نشد."
                : activeTab === "recent"
                  ? "در ۲۴ ساعت گذشته جوابدهی‌ای ثبت نشده است."
                  : "بیمار ویرایش‌شده‌ای در انتظار ارسال لینک نیست."}
            </div>
          ) : (
            <div className="p-4">
              {activeTab === "recent" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">بیمار</TableHead>
                      <TableHead className="text-right">شماره پرونده</TableHead>
                      <TableHead className="text-right">کد ملی</TableHead>
                      <TableHead className="text-right">موبایل</TableHead>
                      <TableHead className="text-right">
                        زمان ثبت جوابدهی
                      </TableHead>
                      <TableHead className="text-center">وضعیت</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-right text-xs font-bold text-slate-900">
                          {item.patient_name}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                            {item.file_number || "—"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-right font-mono text-xs text-slate-600"
                          dir="ltr"
                        >
                          {item.national_code}
                        </TableCell>
                        <TableCell
                          className="text-right font-mono text-xs text-slate-600"
                          dir="ltr"
                        >
                          {item.mobile || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-600">
                          <div>{formatDateTime(item.created_at)}</div>
                          <div className="text-[11px] text-slate-400">
                            {timeAgo(item.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.resend_count > 0 ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                              title={`آخرین ارسال: ${formatDateTime(item.last_resent_at)}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              ارسال مجدد ×
                              {item.resend_count.toLocaleString("fa-IR")}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">
                              ارسال اولیه
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderResendButton(`a-${item.id}`, () =>
                            handleResendArchive(item),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">بیمار</TableHead>
                      <TableHead className="text-right">شماره پرونده</TableHead>
                      <TableHead className="text-right">کد ملی</TableHead>
                      <TableHead className="text-right">موبایل</TableHead>
                      <TableHead className="text-right">زمان ویرایش</TableHead>
                      <TableHead className="text-right">
                        آخرین جوابدهی
                      </TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-right text-xs font-bold text-slate-900">
                          {item.full_name}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                            {item.file_number || "—"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-right font-mono text-xs text-slate-600"
                          dir="ltr"
                        >
                          {item.national_code}
                        </TableCell>
                        <TableCell
                          className="text-right font-mono text-xs text-slate-600"
                          dir="ltr"
                        >
                          {item.mobile || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-600">
                          <div>{formatDateTime(item.edited_at)}</div>
                          <div className="text-[11px] text-slate-400">
                            {timeAgo(item.edited_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-600">
                          {formatDateTime(item.archive_created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderResendButton(`p-${item.id}`, () =>
                            handleResendPatient(item),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    قبلی
                  </Button>
                  <span className="px-2 text-xs text-slate-500">
                    صفحه {safePage.toLocaleString("fa-IR")} از{" "}
                    {totalPages.toLocaleString("fa-IR")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === totalPages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
