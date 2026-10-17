import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// لود تنبل صفحات
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DoctorsManagement = lazy(() => import("./pages/DoctorsManagement"));
const PatientsManagement = lazy(() => import("./pages/PatientsManagement"));
const SecretariesManagement = lazy(
  () => import("@/pages/SecretariesManagement"),
);
const LabResultsManagement = lazy(() => import("./pages/LabResultsManagement"));
const ArchivesManagement = lazy(() => import("./pages/ArchivesManagement"));
const ReportsManagement = lazy(() => import("./pages/ReportsManagement"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const ServicesManagement = lazy(() => import("@/pages/ServicesManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

// نمایش لودینگ هنگام بارگذاری صفحات
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ورود */}
          <Route
            path="/login"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />

          {/* انقضای نشست */}
          {/* نشست منقضی‌شده */}
          <Route
            path="/session-expired"
            element={
              <NotFound
                type="expired"
                errorCode="401"
                redirectPath="/login"
                customTitle="نشست شما پایان یافته است"
                customMessage="با ورود به دستگاه دیگر، این نشست منقضی شد. لطفاً مجدداً وارد شوید."
              />
            }
          />

          {/* داشبورد: در دسترس همه نقش‌های واردشده */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* فقط ادمین */}
          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DoctorsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaries"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SecretariesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ArchivesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ServicesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReportsManagement />
              </ProtectedRoute>
            }
          />

          {/* بیماران: ادمین و هر دو سطح منشی */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "staff_level_1", "staff_level_2"]}
              >
                <PatientsManagement />
              </ProtectedRoute>
            }
          />

          {/* جوابدهی: ادمین و هر دو سطح منشی */}
          <Route
            path="/results"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "staff_level_1", "staff_level_2"]}
              >
                <LabResultsManagement />
              </ProtectedRoute>
            }
          />

          {/* پرتال اختصاصی بیمار */}
          <Route path="/portal/:token" element={<PatientPortal />} />

          {/* مسیر خطا برای فراخوانی مستقیم */}
          <Route
            path="/not-found"
            element={<NotFound type="404" redirectPath="/login" />}
          />

          {/* مسیر پیش‌فرض برای آدرس‌های ناشناخته */}
          <Route
            path="*"
            element={<NotFound type="404" redirectPath="/login" />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
