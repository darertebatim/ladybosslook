import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureLoading, ApertureButton,
} from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Upload, Trash2, FileText } from "lucide-react";

interface FileRow {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  extracted_fact_count: number;
  error_message: string | null;
  created_at: string;
  storage_path: string;
}

const ACCEPT = ".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,application/pdf,text/plain,text/markdown,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 20 * 1024 * 1024;

function humanSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Files page — users upload documents (contracts, price lists, old ads,
 * past tax summaries). RiloBiz reads them and turns the useful bits
 * into memory facts. Same mental model as Claude Projects' file pane.
 */
export default function RealFiles() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("aperture_files")
      .select("id,file_name,mime_type,size_bytes,status,extracted_fact_count,error_message,created_at,storage_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFiles((data ?? []) as FileRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const uploadOne = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > MAX_BYTES) {
      alert(`${file.name} is over 20 MB.`);
      return;
    }
    const id = crypto.randomUUID();
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const storagePath = `${user.id}/${id}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("aperture-files")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (upErr) {
      alert(`Upload failed: ${upErr.message}`);
      return;
    }

    const { error: insErr } = await supabase.from("aperture_files").insert({
      id,
      user_id: user.id,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      storage_path: storagePath,
      status: "reading",
    });
    if (insErr) {
      alert(`Save failed: ${insErr.message}`);
      return;
    }

    // Fire-and-forget extraction; UI polls via refresh().
    supabase.functions.invoke("aperture-file-ingest", { body: { file_id: id } })
      .catch((e) => console.error("ingest invoke failed", e))
      .finally(() => refresh());
  }, [user, refresh]);

  const onFiles = useCallback(async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(list)) await uploadOne(f);
      await refresh();
    } finally {
      setUploading(false);
    }
  }, [uploadOne, refresh]);

  const remove = useCallback(async (f: FileRow) => {
    if (!confirm(`Delete ${f.file_name}? Memory facts from this file will be unlinked.`)) return;
    await supabase.storage.from("aperture-files").remove([f.storage_path]);
    await supabase.from("aperture_files").delete().eq("id", f.id);
    await refresh();
  }, [refresh]);

  return (
    <>
      <Helmet><title>Files · RiloBiz</title></Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 12 }}>
          <Link to="/app/rilobiz/app/memory" style={{ textDecoration: "none" }}>
            <ApertureButton variant="ghost" size="sm">
              <ArrowLeft size={13} /> Memory
            </ApertureButton>
          </Link>
        </div>

        <PageHeader
          index="FILES"
          title="Files RiloBiz has read"
          sub="Upload contracts, price lists, old ads, past tax summaries — I'll read them and turn the useful bits into memory facts."
          action={<ApertureChip tone={files.length ? "signal" : "neutral"}>{files.length} files</ApertureChip>}
        />

        <ApertureCard padding={0} style={{ marginBottom: 20, overflow: "hidden" }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
            style={{
              padding: "32px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              background: dragOver ? "var(--ap-surface-2)" : "transparent",
              transition: "background 120ms ease",
              cursor: "pointer",
            }}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={22} color="var(--ap-ink-2)" />
            <div style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500 }}>
              Drop files here or click to upload
            </div>
            <div style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>
              PDF, DOCX, TXT, MD, PNG, JPG · up to 20 MB
            </div>
            {uploading && <ApertureMonoLabel>Uploading…</ApertureMonoLabel>}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
        </ApertureCard>

        {loading ? (
          <ApertureLoading label="Loading…" />
        ) : files.length === 0 ? (
          <ApertureCard padding={20}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)" }}>
              No files yet. Drop in anything useful and I'll learn from it.
            </p>
          </ApertureCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f) => {
              const statusTone: "signal" | "neutral" | "live" =
                f.status === "read" ? "signal" :
                f.status === "failed" ? "neutral" : "live";
              const statusLabel =
                f.status === "read" ? `Read · ${f.extracted_fact_count} facts` :
                f.status === "failed" ? "Failed" : "Reading…";
              return (
                <ApertureCard key={f.id} padding={14}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <FileText size={18} color="var(--ap-ink-2)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.file_name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ap-ink-3)", marginTop: 2 }}>
                        {humanSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString()}
                        {f.error_message ? ` · ${f.error_message}` : ""}
                      </div>
                    </div>
                    <ApertureChip tone={statusTone}>{statusLabel}</ApertureChip>
                    <button
                      onClick={() => remove(f)}
                      aria-label="Delete"
                      style={{
                        appearance: "none", background: "transparent", border: "none",
                        cursor: "pointer", color: "var(--ap-ink-3)", padding: 6,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </ApertureCard>
              );
            })}
          </div>
        )}
      </RealAppShell>
    </>
  );
}