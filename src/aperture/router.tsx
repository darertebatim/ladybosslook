import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApertureLayout } from "@/aperture/components/ApertureLayout";

const BrandShowcase = lazy(() => import("@/aperture/pages/brand/BrandShowcase"));
const ApertureHome = lazy(() => import("@/aperture/pages/app/Home"));
const Playbooks = lazy(() => import("@/aperture/pages/app/Playbooks"));
const PlaybookDetail = lazy(() => import("@/aperture/pages/app/PlaybookDetail"));
const Chat = lazy(() => import("@/aperture/pages/app/Chat"));
const Memory = lazy(() => import("@/aperture/pages/app/Memory"));
const Integrations = lazy(() => import("@/aperture/pages/app/Integrations"));
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
          {/* Phase 2 — product app */}
          <Route path="app" element={<ApertureHome />} />
          <Route path="app/playbooks" element={<Playbooks />} />
          <Route path="app/playbooks/:slug" element={<PlaybookDetail />} />
          <Route path="app/chat" element={<Chat />} />
          <Route path="app/memory" element={<Memory />} />
          <Route path="app/integrations" element={<Integrations />} />
          <Route path="app/settings" element={<Settings />} />
          {/* Phase 3 (marketing) lands here later */}
          <Route path="*" element={<Navigate to="app" replace />} />
        </Routes>
      </Suspense>
    </ApertureLayout>
  );
}