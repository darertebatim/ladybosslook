import { PageHeader } from "@/components/app/ui/PageHeader";

export default function HeaderPreviewTmp() {
  return (
    <div className="app-theme min-h-screen bg-background">
      <PageHeader
        title={
          <span className="flex flex-col items-center leading-tight">
            <span>My Programs</span>
            <span className="mt-0.5 text-[11px] font-medium text-fg-warm-muted">
              32 enrolled
            </span>
          </span>
        }
        menu
        stats
      />
      <div className="p-4 text-sm text-fg-warm-muted">header preview</div>
    </div>
  );
}
