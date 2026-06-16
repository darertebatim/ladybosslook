import { useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSignedAttachmentUrl } from "@/aperture/lib/chatAttachments";

interface Attachment {
  file_id: string;
  storage_path: string;
  mime: string;
  name: string;
  size: number;
}

/** Thumbnail/file grid for attachments on a user message bubble. */
export function ChatAttachments({ attachments }: { attachments: Attachment[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
      {attachments.map((a) => (
        <AttachmentTile key={a.file_id || a.storage_path} att={a} />
      ))}
    </div>
  );
}

function AttachmentTile({ att }: { att: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = att.mime?.startsWith("image/");
  useEffect(() => {
    if (!isImage || !att.storage_path) return;
    let alive = true;
    getSignedAttachmentUrl(att.storage_path).then(u => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [isImage, att.storage_path]);

  if (isImage) {
    return (
      <a href={url ?? "#"} target="_blank" rel="noreferrer" style={{
        display: "block", width: 140, height: 140, borderRadius: 12,
        overflow: "hidden", background: "var(--ap-surface-2)",
        border: "1px solid var(--ap-hairline)",
      }}>
        {url
          ? <img src={url} alt={att.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%" }} />}
      </a>
    );
  }
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 10,
      background: "var(--ap-surface-2)", color: "var(--ap-ink-1)",
      border: "1px solid var(--ap-hairline)", fontSize: 12.5,
      maxWidth: 220,
    }}>
      <FileText size={16} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
    </div>
  );
}

/**
 * "Saved N facts → Bucket" chip rendered under a user message with attachments.
 * Polls aperture_files.status until all are read, then reads back any
 * memory items the ingest job created and links to the matching bucket.
 */
export function AttachmentMemoryChip({ fileIds }: { fileIds: string[] }) {
  const [state, setState] = useState<{
    done: boolean;
    failed: boolean;
    factCount: number;
    bucket: string | null;
  }>({ done: false, failed: false, factCount: 0, bucket: null });

  useEffect(() => {
    if (fileIds.length === 0) return;
    let alive = true;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      const { data: files } = await supabase
        .from("aperture_files")
        .select("id,status,extracted_fact_count")
        .in("id", fileIds);
      if (!alive || !files) return;
      const allDone = files.every(f => f.status === "read" || f.status === "failed");
      if (!allDone && attempts < 30) {
        setTimeout(poll, 2500);
        return;
      }
      const failed = files.every(f => f.status === "failed");
      const totalFacts = files.reduce((sum, f) => sum + (f.extracted_fact_count ?? 0), 0);

      let bucket: string | null = null;
      if (totalFacts > 0) {
        const { data: items } = await supabase
          .from("aperture_memory_items")
          .select("bucket_slug")
          .in("source_file_id", fileIds)
          .limit(50);
        const counts: Record<string, number> = {};
        (items ?? []).forEach((r: any) => {
          if (r.bucket_slug) counts[r.bucket_slug] = (counts[r.bucket_slug] ?? 0) + 1;
        });
        bucket = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      }
      if (alive) setState({ done: true, failed, factCount: totalFacts, bucket });
    };
    setTimeout(poll, 2500);
    return () => { alive = false; };
  }, [fileIds.join(",")]);

  if (!state.done) {
    return (
      <span style={{ fontSize: 11, color: "var(--ap-ink-3)", fontFamily: "var(--ap-font-mono)" }}>
        Reading attachments…
      </span>
    );
  }
  if (state.failed || state.factCount === 0) return null;
  const label = `Saved ${state.factCount} fact${state.factCount === 1 ? "" : "s"} to memory`;
  const inner = (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: "var(--ap-signal-soft)", color: "var(--ap-signal)",
      fontSize: 11, fontWeight: 600,
      fontFamily: "var(--ap-font-sans)",
    }}>
      <Sparkles size={11} />
      {label}{state.bucket ? ` → ${bucketLabel(state.bucket)}` : ""}
    </span>
  );
  if (state.bucket) {
    return (
      <Link to={`/aperture/app/memory/${state.bucket}`} style={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function bucketLabel(slug: string): string {
  return slug
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}