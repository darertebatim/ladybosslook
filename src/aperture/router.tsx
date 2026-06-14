import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ApertureLayout } from "@/aperture/components/ApertureLayout";
import { useAuth } from "@/hooks/useAuth";

const BrandShowcase = lazy(() => import("@/aperture/pages/brand/BrandShowcase"));
const Home = lazy(() => import("@/aperture/pages/app/Home"));
const Memory = lazy(() => import("@/aperture/pages/app/Memory"));
const BucketPage = lazy(() => import("@/aperture/pages/app/Bucket"));
const Chats = lazy(() => import("@/aperture/pages/app/Chats"));
const ChatThreadPage = lazy(() => import("@/aperture/pages/app/ChatThread"));
const Library = lazy(() => import("@/aperture/pages/app/Library"));
const ActionPage = lazy(() => import("@/aperture/pages/app/Action"));
const Settings = lazy(() => import("@/aperture/pages/app/Settings"));

function ApertureLoader() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        className="ap-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ap-ink-3)",
        }}
      >
        Loading
      </span>
    </div>
  );
}

/**
 * Aperture reuses the main app's /auth flow. Any unauthenticated visit to
 * an /aperture/brand/mockup/* route is bounced to /auth with a redirect back.
 * /aperture/brand is public so the design showcase stays browsable.
 */
function ApertureAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <ApertureLoader />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

/**
 * Top-level Aperture router. Mounted at /aperture/* in App.tsx.
 * All Aperture pages live inside <ApertureLayout> so they share
 * the scoped token layer and day/night theme.
 */
export default function ApertureRouter() {
  return (
    <ApertureLayout>
      <Suspense fallback={<ApertureLoader />}>
        <Routes>
          <Route index element={<Navigate to="app" replace />} />
          <Route path="brand" element={<BrandShowcase />} />
          {/* Aperture — AI business advisor */}
          <Route path="app" element={<ApertureAuthGate><Home /></ApertureAuthGate>} />
          <Route path="app/memory" element={<ApertureAuthGate><Memory /></ApertureAuthGate>} />
          <Route path="app/memory/:slug" element={<ApertureAuthGate><BucketPage /></ApertureAuthGate>} />
          <Route path="app/chats" element={<ApertureAuthGate><Chats /></ApertureAuthGate>} />
          <Route path="app/chats/:id" element={<ApertureAuthGate><ChatThreadPage /></ApertureAuthGate>} />
          <Route path="app/library" element={<ApertureAuthGate><Library /></ApertureAuthGate>} />
          <Route path="app/library/:slug" element={<ApertureAuthGate><ActionPage /></ApertureAuthGate>} />
          <Route path="app/settings" element={<ApertureAuthGate><Settings /></ApertureAuthGate>} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Suspense>
    </ApertureLayout>
  );
}