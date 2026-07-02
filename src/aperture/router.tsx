import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ApertureLayout } from "@/aperture/components/ApertureLayout";
import { useAuth } from "@/hooks/useAuth";
import { ApertureInviteGate } from "@/aperture/components/ApertureInviteGate";

const BrandShowcase = lazy(() => import("@/aperture/pages/brand/BrandShowcase"));
const Home = lazy(() => import("@/aperture/pages/app/Home"));
const Memory = lazy(() => import("@/aperture/pages/app/Memory"));
const BucketPage = lazy(() => import("@/aperture/pages/app/Bucket"));
const Chats = lazy(() => import("@/aperture/pages/app/Chats"));
const ChatThreadPage = lazy(() => import("@/aperture/pages/app/ChatThread"));
const Library = lazy(() => import("@/aperture/pages/app/Library"));
const ActionPage = lazy(() => import("@/aperture/pages/app/Action"));
const Settings = lazy(() => import("@/aperture/pages/app/Settings"));

// Real Supabase-backed product at /app/rilobiz/app/*
const RealHome = lazy(() => import("@/aperture/pages/real/Home"));
const RealMemory = lazy(() => import("@/aperture/pages/real/Memory"));
const RealBucket = lazy(() => import("@/aperture/pages/real/Bucket"));
const RealChats = lazy(() => import("@/aperture/pages/real/Chats"));
const RealChatThread = lazy(() => import("@/aperture/pages/real/ChatThread"));
const RealLibrary = lazy(() => import("@/aperture/pages/real/Library"));
const RealAction = lazy(() => import("@/aperture/pages/real/Action"));
const RealSettings = lazy(() => import("@/aperture/pages/real/Settings"));
const OnboardQuick = lazy(() => import("@/aperture/pages/real/OnboardQuick"));
const OnboardFull = lazy(() => import("@/aperture/pages/real/OnboardFull"));
const OnboardConfirm = lazy(() => import("@/aperture/pages/real/OnboardConfirm"));
const OnboardEssential = lazy(() => import("@/aperture/pages/real/OnboardEssential"));
const WaveRunner = lazy(() => import("@/aperture/pages/real/WaveRunner"));
const RealFiles = lazy(() => import("@/aperture/pages/real/Files"));
const RealTools = lazy(() => import("@/aperture/pages/real/Tools"));
const ApertureAuth = lazy(() => import("@/aperture/pages/real/Auth"));
const Marketing = lazy(() => import("@/aperture/pages/marketing/Marketing"));

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
 * RiloBiz reuses the main app's /auth flow. Any unauthenticated visit to
 * an /aperture/brand/mockup/* route is bounced to /auth with a redirect back.
 * /aperture/brand is public so the design showcase stays browsable.
 */
function ApertureAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <ApertureLoader />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/app/rilobiz/auth?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

function ApertureGate({ children }: { children: React.ReactNode }) {
  return (
    <ApertureAuthGate>
      <ApertureInviteGate>{children}</ApertureInviteGate>
    </ApertureAuthGate>
  );
}

/**
 * Top-level RiloBiz router. Mounted at /aperture/* in App.tsx.
 * All RiloBiz pages live inside <ApertureLayout> so they share
 * the scoped token layer and day/night theme.
 */
export default function ApertureRouter() {
  return (
    <ApertureLayout>
      <Suspense fallback={<ApertureLoader />}>
        <Routes>
          <Route index element={<Navigate to="brand" replace />} />
          <Route path="brand" element={<BrandShowcase />} />
          {/* Public marketing landing for RiloBiz */}
          <Route path="marketing" element={<Marketing />} />
          {/* RiloBiz mockup — design demo, no auth, mock data */}
          <Route path="brand/mockup" element={<Home />} />
          <Route path="brand/mockup/memory" element={<Memory />} />
          <Route path="brand/mockup/memory/:slug" element={<BucketPage />} />
          <Route path="brand/mockup/chats" element={<Chats />} />
          <Route path="brand/mockup/chats/:id" element={<ChatThreadPage />} />
          <Route path="brand/mockup/library" element={<Library />} />
          <Route path="brand/mockup/library/:slug" element={<ActionPage />} />
          <Route path="brand/mockup/settings" element={<Settings />} />
          {/* RiloBiz-branded auth page */}
          <Route path="auth" element={<ApertureAuth />} />
          {/* Real product — Supabase-backed, auth-gated */}
          <Route path="app" element={<ApertureGate><RealHome /></ApertureGate>} />
          <Route path="app/memory" element={<ApertureGate><RealMemory /></ApertureGate>} />
          <Route path="app/memory/files" element={<ApertureGate><RealFiles /></ApertureGate>} />
          <Route path="app/memory/tools" element={<ApertureGate><RealTools /></ApertureGate>} />
          <Route path="app/memory/:slug" element={<ApertureGate><RealBucket /></ApertureGate>} />
          <Route path="app/chats" element={<ApertureGate><RealChats /></ApertureGate>} />
          <Route path="app/chats/:id" element={<ApertureGate><RealChatThread /></ApertureGate>} />
          <Route path="app/library" element={<ApertureGate><RealLibrary /></ApertureGate>} />
          <Route path="app/library/:slug" element={<ApertureGate><RealAction /></ApertureGate>} />
          <Route path="app/settings" element={<ApertureGate><RealSettings /></ApertureGate>} />
          <Route path="app/onboard/quick" element={<ApertureGate><OnboardQuick /></ApertureGate>} />
          <Route path="app/onboard/full" element={<ApertureGate><OnboardFull /></ApertureGate>} />
          <Route path="app/onboard/confirm" element={<ApertureGate><OnboardConfirm /></ApertureGate>} />
          <Route path="app/onboard/essential" element={<ApertureGate><OnboardEssential /></ApertureGate>} />
          <Route path="app/waves/:waveNumber" element={<ApertureGate><WaveRunner /></ApertureGate>} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Suspense>
    </ApertureLayout>
  );
}