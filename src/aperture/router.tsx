import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApertureLayout } from "@/aperture/components/ApertureLayout";

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
          <Route path="app" element={<Home />} />
          <Route path="app/memory" element={<Memory />} />
          <Route path="app/memory/:slug" element={<BucketPage />} />
          <Route path="app/chats" element={<Chats />} />
          <Route path="app/chats/:id" element={<ChatThreadPage />} />
          <Route path="app/library" element={<Library />} />
          <Route path="app/library/:slug" element={<ActionPage />} />
          <Route path="app/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Suspense>
    </ApertureLayout>
  );
}