import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute  from "./components/ProtectedRoute";
import AdminLayout     from "./components/AdminLayout";

// Public pages
import Login               from "./pages/Login";
import SupplierRegistration from "./pages/SupplierRegistration";

// Admin pages
import Dashboard           from "./pages/Dashboard";
import OfficeKiosk         from "./pages/OfficeKiosk";
import DeliveryForm        from "./pages/DeliveryForm";
import BackOfficeTargets   from "./pages/BackOfficeTargets";
import InfoPortal          from "./pages/InfoPortal";
import PricingBenefitsCMS  from "./pages/PricingBenefitsCMS";
import TierEngine          from "./pages/TierEngine";

// Supplier pages
import SupplierPortal      from "./pages/SupplierPortal";

function AdminRoute({ children }) {
  return (
    <ProtectedRoute role="admin">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

function RootRedirect() {
  const { session, loading, role } = useAuth();
  if (loading) return null;
  if (!session)           return <Navigate to="/login"     replace />;
  if (role === "admin")   return <Navigate to="/dashboard" replace />;
  if (role === "supplier")return <Navigate to="/portal"    replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Root ── */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── Public ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<SupplierRegistration />} />

        {/* ── Admin ── */}
        <Route path="/dashboard"   element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/kiosk"       element={<AdminRoute><OfficeKiosk /></AdminRoute>} />
        <Route path="/delivery"    element={<AdminRoute><DeliveryForm /></AdminRoute>} />
        <Route path="/targets"     element={<AdminRoute><BackOfficeTargets /></AdminRoute>} />
        <Route path="/portal-info" element={<AdminRoute><InfoPortal /></AdminRoute>} />
        <Route path="/cms"         element={<AdminRoute><PricingBenefitsCMS /></AdminRoute>} />
        <Route path="/tier-engine" element={<AdminRoute><TierEngine /></AdminRoute>} />

        {/* ── Supplier ── */}
        <Route path="/portal" element={
          <ProtectedRoute role="supplier">
            <SupplierPortal />
          </ProtectedRoute>
        } />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
