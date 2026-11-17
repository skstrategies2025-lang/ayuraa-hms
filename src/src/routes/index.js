import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getSession } from "@/common";
import Login from "@/modules/auth/Login";

// HMS is large, so it is only downloaded after login
const HmsPortal = lazy(() => import("@/modules/hms/HmsPortal"));

function Protected({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={getSession() ? "/hms/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/hms/:tab?"
        element={
          <Protected>
            <Suspense fallback={<div className="p-8 text-sm">Loading…</div>}>
              <HmsPortal />
            </Suspense>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
