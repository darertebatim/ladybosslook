import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { Plus, Camera, Image as ImageIcon, Paperclip, X, FileText, Loader2, Square } from "lucide-react";
import {
  MAX_ATTACHMENTS, makePending, uploadPending, validateFiles,
  type PendingAttachment, type SentAttachment,
} from "@/aperture/lib/chatAttachments";
import { toast } from "@/hooks/use-toast";

interface Props {
  chatId: string;
  userId: string;
  disabled?: boolean;
  /** True while an AI response is currently streaming. Switches the
   *  send button into a stop affordance and disables the input. */
  streaming?: boolean;
  /** Abort the in-flight stream. */
  onStop?: () => void;
  onSend: (text: string, attachments: SentAttachment[]) => void | Promise<void>;
}

/**
 * Chat composer with attachment support.
 * - Tap "+" to open Camera / Photos / Files sheet.
 * - Paste image (Cmd/Ctrl+V) to attach.
 * - Drag-and-drop files anywhere onto the composer.
 */
export function ChatComposer({ chatId, userId, disabled, streaming, onStop, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs when attachments unmount.
  useEffect(() => {
    return () => {
      pending.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list as ArrayLike<File>);
    if (arr.length === 0) return;
    const { ok, rejected } = validateFiles(arr);
    rejected.forEach(r => toast({ title: "Can't attach", description: r.reason, variant: "destructive" }));
    setPending(prev => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (room <= 0) {
        toast({ title: "Limit reached", description: `Max ${MAX_ATTACHMENTS} files per message.`, variant: "destructive" });
        return prev;
      }
      const accepted = ok.slice(0, room).map(makePending);
      if (ok.length > room) {
        toast({ title: "Some files skipped", description: `Only the first ${room} were added.`, variant: "destructive" });
      }
      return [...prev, ...accepted];
    });
  }, []);

  const removePending = (localId: string) => {
    setPending(prev => {
      const target = prev.find(p => p.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.localId !== localId);
    });
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const canSend = !disabled && !streaming && (draft.trim().length > 0 || pending.length > 0)
    && !pending.some(p => p.status === "uploading");

  const submit = async () => {
    if (!canSend) return;
    // Upload everything that isn't already uploaded.
    const sent: SentAttachment[] = [];
    const updated: PendingAttachment[] = [...pending];
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      if (p.status === "uploaded" && p.fileId && p.storagePath) {
        sent.push({ file_id: p.fileId, storage_path: p.storagePath, mime: p.mime, name: p.name, size: p.size });
        continue;
      }
      updated[i] = { ...p, status: "uploading" };
      setPending([...updated]);
      try {
        const s = await uploadPending(p, { userId, chatId });
        sent.push(s);
        updated[i] = { ...p, status: "uploaded", fileId: s.file_id, storagePath: s.storage_path };
        setPending([...updated]);
      } catch (err: any) {
        updated[i] = { ...p, status: "failed", error: err?.message ?? "Upload failed" };
        setPending([...updated]);
        toast({ title: "Upload failed", description: err?.message ?? "Try again", variant: "destructive" });
        return;
      }
    }
    const text = draft;
    setDraft("");
    // Clear previews
    pending.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setPending([]);
    await onSend(text, sent);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{ marginTop: 14, position: "relative" }}
    >
      {dragOver && (
        <div style={{
          position: "absolute", inset: -8, zIndex: 5,
          border: "2px dashed var(--ap-signal)", borderRadius: 16,
          background: "var(--ap-signal-soft)", color: "var(--ap-signal)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, pointerEvents: "none",
        }}>
          Drop to attach
        </div>
      )}

      {/* Thumbnail preview row */}
      {pending.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {pending.map(p => (
            <div key={p.localId} style={{
              position: "relative", width: 56, height: 56, borderRadius: 10,
              background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {p.previewUrl ? (
                <img src={p.previewUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 4 }}>
                  <FileText size={18} color="var(--ap-ink-2)" />
                  <span style={{ fontSize: 9, color: "var(--ap-ink-3)", maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              {p.status === "uploading" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={16} color="white" className="ap-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(p.localId)}
                aria-label="Remove"
                style={{
                  position: "absolute", top: 2, right: 2,
                  width: 18, height: 18, borderRadius: 999,
                  background: "rgba(0,0,0,0.7)", color: "white", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        style={{
          display: "flex", gap: 6, alignItems: "center",
          padding: 6, background: "var(--ap-surface-1)",
          border: "1px solid var(--ap-hairline)", borderRadius: 999,
        }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={disabled}
          aria-label="Add attachment"
          style={{
            appearance: "none", cursor: disabled ? "default" : "pointer",
            border: "none", height: 36, width: 36, borderRadius: 999,
            background: "var(--ap-surface-2)", color: "var(--ap-ink-1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Plus size={18} />
        </button>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPaste={onPaste}
          placeholder={streaming ? "RiloBiz is replying…" : "Type your answer..."}
          disabled={disabled || streaming}
          style={{
            flex: 1, appearance: "none", border: "none", outline: "none",
            background: "transparent", color: "var(--ap-ink-1)",
            padding: "10px 4px", fontSize: 14, fontFamily: "var(--ap-font-sans)",
            minWidth: 0,
          }}
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => onStop?.()}
            aria-label="Stop generating"
            style={{
              appearance: "none", cursor: "pointer",
              border: "none", height: 36, width: 36, borderRadius: 999,
              background: "var(--ap-ink-1)", color: "var(--ap-canvas)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          style={{
            appearance: "none", cursor: canSend ? "pointer" : "default",
            border: "none", height: 36, width: 36, borderRadius: 999,
            background: canSend ? "var(--ap-signal)" : "var(--ap-surface-3)",
            color: canSend ? "var(--ap-on-signal)" : "var(--ap-ink-3)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
        )}
      </form>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={photoRef} type="file" accept="image/*" multiple
        style={{ display: "none" }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={fileRef} type="file"
        accept="image/*,application/pdf,.txt,.md,.csv,.xlsx,.xls,text/plain,text/markdown,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        multiple style={{ display: "none" }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Bottom sheet */}
      {sheetOpen && (
        <>
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              zIndex: 10050,
            }}
          />
          <div
            role="dialog"
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10051,
              background: "var(--ap-surface-1)",
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: "10px 8px max(env(safe-area-inset-bottom), 16px)",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
              animation: "ap-sheet-up 180ms ease",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--ap-hairline-strong)", margin: "4px auto 10px" }} />
            <SheetButton icon={<Camera size={20} />} label="Take photo"
              onClick={() => { setSheetOpen(false); cameraRef.current?.click(); }} />
            <SheetButton icon={<ImageIcon size={20} />} label="Choose photo"
              onClick={() => { setSheetOpen(false); photoRef.current?.click(); }} />
            <SheetButton icon={<Paperclip size={20} />} label="Choose file"
              onClick={() => { setSheetOpen(false); fileRef.current?.click(); }} />
          </div>
        </>
      )}
      <style>{`
        @keyframes ap-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .ap-spin { animation: ap-spin 800ms linear infinite; }
        @keyframes ap-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function SheetButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none", cursor: "pointer", border: "none",
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 12,
        background: "transparent", color: "var(--ap-ink-1)",
        fontSize: 15, fontFamily: "var(--ap-font-sans)", textAlign: "left",
      }}
      className="ap-chip-press"
    >
      <span style={{
        width: 38, height: 38, borderRadius: 999,
        background: "var(--ap-surface-2)", color: "var(--ap-ink-1)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</span>
      {label}
    </button>
  );
}