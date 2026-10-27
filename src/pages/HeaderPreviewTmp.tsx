import { PageHeader } from "@/components/app/ui/PageHeader";

export default function HeaderPreviewTmp() {
  return (
    <div className="app-theme min-h-screen bg-background">
      <PageHeader
        title="My Programs"
        menu
        stats
        subRow={
          <p className="text-xs text-center text-fg-warm-muted">32 enrolled</p>
        }
      />
      <div className="p-4 text-sm text-fg-warm-muted">header preview</div>
    </div>
  );
}
