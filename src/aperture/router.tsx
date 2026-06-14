import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApertureLayout } from "@/aperture/components/ApertureLayout";

const BrandShowcase = lazy(() => import("@/aperture/pages/brand/BrandShowcase"));

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
          <Route index element={<Navigate to="brand" replace />} />
          <Route path="brand" element={<BrandShowcase />} />
          {/* Phase 2 (app) + Phase 3 (marketing) routes land here later */}
          <Route path="*" element={<Navigate to="brand" replace />} />
        </Routes>
      </Suspense>
    </ApertureLayout>
  );
}