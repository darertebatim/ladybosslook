import { Helmet } from "react-helmet-async";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel, ApertureThemeSwitch,
} from "@/aperture/components/primitives";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";
import { useApertureChats } from "@/aperture/hooks/useApertureChats";
import { BUCKETS } from "@/aperture/data/buckets";

export default function Settings() {
  const { buckets, completion, clearBucket } = useApertureMemory();
  const { chats, deleteChat } = useApertureChats();

  function resetEverything() {
    if (!confirm("Wipe all memory + all chats from this browser?")) return;
    BUCKETS.forEach(b => clearBucket(b.slug));
    chats.forEach(c => deleteChat(c.id));
  }

  return (
    <>
      <Helmet>
        <title>Settings · RiloBiz</title>
      </Helmet>
      <AppShell>
        <PageHeader
          index="04 · SETTINGS"
          title="Settings"
          sub="This is a design demo. All memory and chats live in your browser only."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ApertureCard padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <ApertureMonoLabel>Appearance</ApertureMonoLabel>
                <h3 style={{ margin: "6px 0 2px", fontSize: 15, color: "var(--ap-ink-1)", fontWeight: 600 }}>Theme</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)" }}>Day or night — RiloBiz works in both.</p>
              </div>
              <ApertureThemeSwitch />
            </div>
          </ApertureCard>

          <ApertureCard padding={18}>
            <ApertureMonoLabel>Memory</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 2px", fontSize: 15, color: "var(--ap-ink-1)", fontWeight: 600 }}>{completion}% of business profile filled</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ap-ink-2)" }}>
              {buckets.filter(b => b.status !== "empty").length} of {buckets.length} buckets started.
            </p>
          </ApertureCard>

          <ApertureCard padding={18}>
            <ApertureMonoLabel>Chats</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 2px", fontSize: 15, color: "var(--ap-ink-1)", fontWeight: 600 }}>{chats.length} conversation{chats.length === 1 ? "" : "s"}</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ap-ink-2)" }}>Stored in this browser. Clearing them does not affect your memory buckets.</p>
          </ApertureCard>

          <ApertureCard padding={18} style={{ borderColor: "var(--ap-hairline-strong)" }}>
            <ApertureMonoLabel color="var(--ap-danger)">Danger zone</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 2px", fontSize: 15, color: "var(--ap-ink-1)", fontWeight: 600 }}>Reset the demo</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ap-ink-2)" }}>
              Wipes every memory bucket and every chat from this browser. Useful for trying the empty state again.
            </p>
            <ApertureButton onClick={resetEverything}>Wipe memory + chats</ApertureButton>
          </ApertureCard>
        </div>
      </AppShell>
    </>
  );
}