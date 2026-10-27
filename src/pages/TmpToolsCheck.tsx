import { Suspense, lazy } from "react";
import { HomeMenu } from "@/components/app/HomeMenu";
const AppStore = lazy(() => import("@/pages/app/AppStore"));

export default function TmpToolsCheck() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-center px-4 pt-3 gap-2 shrink-0">
        <HomeMenu />
      </div>
      <div className="flex-1 min-h-0">
        <Suspense fallback={null}>
          <AppStore />
        </Suspense>
      </div>
    </div>
  );
}
