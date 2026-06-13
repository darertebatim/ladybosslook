import { createContext, useContext, useState } from 'react';
import {
  Search, Plus, Send, Sparkles, ChevronRight, Command, Settings, MoreHorizontal,
  MessageSquare, BookOpen, Database, Zap, ArrowUp, Mic, Paperclip, Check,
  TrendingUp, FileText, Mail, Megaphone, Target, Layers, ChevronDown, Menu, Plug,
} from 'lucide-react';

/**
 * Quiet Power — visual mock for the business-AI product
 * Inspired by ElevenLabs aesthetic + Rilo orange accent.
 * Self-contained. Day + Night palettes share the same layout.
 */

type Palette = {
  bg: string; surface: string; surface2: string;
  hairline: string; hairline2: string;
  text: string; textMid: string; textDim: string;
  orange: string; orangeSoft: string; orangeRing: string;
  onOrange: string;
  success: string; warn: string;
};

const DARK: Palette = {
  bg:        '#0A0A0A',
  surface:   '#141414',
  surface2:  '#1C1C1C',
  hairline:  '#262626',
  hairline2: '#1F1F1F',
  text:      '#FAFAFA',
  textMid:   '#A1A1A1',
  textDim:   '#6B6B6B',
  orange:    '#FF6B1A',
  orangeSoft:'rgba(255,107,26,0.12)',
  orangeRing:'rgba(255,107,26,0.35)',
  onOrange:  '#0A0A0A',
  success:   '#7BB661',
  warn:      '#D4A24C',
};

const LIGHT: Palette = {
  bg:        '#FAFAF7',
  surface:   '#FFFFFF',
  surface2:  '#F4F2EE',
  hairline:  '#E5E2DC',
  hairline2: '#ECEAE4',
  text:      '#0F0F0F',
  textMid:   '#5C5C5C',
  textDim:   '#9A968E',
  orange:    '#EB5E33',
  orangeSoft:'rgba(235,94,51,0.10)',
  orangeRing:'rgba(235,94,51,0.35)',
  onOrange:  '#FFFFFF',
  success:   '#3F8A4C',
  warn:      '#B8852E',
};

const ThemeCtx = createContext<Palette>(DARK);
const useC = () => useContext(ThemeCtx);

const fontSans = `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
const fontMono = `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`;

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

const MonoLabel = ({ children, color }: any) => {
  const C = useC();
  return (
    <span style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: color ?? C.textDim }}>
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// Integrations — connected business infrastructure
// ─────────────────────────────────────────────────────────────

type Integration = { key: string; label: string; tone: string; status: 'live' | 'syncing' | 'off' };

const INTEGRATIONS: Integration[] = [
  { key: 'IG', label: 'Instagram',  tone: '#E1306C', status: 'live' },
  { key: 'SQ', label: 'Square',     tone: '#3B6CF6', status: 'live' },
  { key: 'SF', label: 'Salesforce', tone: '#00A1E0', status: 'live' },
  { key: 'QB', label: 'QuickBooks', tone: '#2CA01C', status: 'live' },
  { key: 'ST', label: 'Stripe',     tone: '#635BFF', status: 'syncing' },
  { key: 'SH', label: 'Shopify',    tone: '#95BF47', status: 'live' },
  { key: 'GA', label: 'GA4',        tone: '#F9AB00', status: 'live' },
  { key: 'HS', label: 'HubSpot',    tone: '#FF7A59', status: 'off' },
];

const IntegrationDot = ({ i, size = 22 }: { i: Integration; size?: number }) => {
  const C = useC();
  return (
  <div style={{
    width: size, height: size, borderRadius: 5, flexShrink: 0,
    background: i.status === 'off' ? C.surface2 : i.tone + '22',
    border: `1px solid ${i.status === 'off' ? C.hairline : i.tone + '55'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  }}>
    <span style={{
      fontFamily: fontMono, fontSize: size <= 22 ? 9 : 10, fontWeight: 600,
      color: i.status === 'off' ? C.textDim : i.tone,
      letterSpacing: '0.02em',
    }}>{i.key}</span>
    {i.status === 'live' && (
      <div style={{
        position: 'absolute', top: -2, right: -2,
        width: 6, height: 6, borderRadius: '50%', background: C.success,
        border: `1.5px solid ${C.bg}`,
      }} />
    )}
    {i.status === 'syncing' && (
      <div style={{
        position: 'absolute', top: -2, right: -2,
        width: 6, height: 6, borderRadius: '50%', background: C.warn,
        border: `1.5px solid ${C.bg}`,
      }} />
    )}
  </div>
  );
};

const PlaybookRow = ({ num, name, category, runs, active }: any) => {
  const C = useC();
  return (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: `1px solid ${C.hairline2}`,
      background: active ? C.surface2 : 'transparent',
      cursor: 'pointer',
    }}
  >
    <span style={{ fontFamily: fontMono, fontSize: 11, color: active ? C.orange : C.textDim, width: 28 }}>
      {num}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: C.text, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em' }}>{name}</div>
      <div style={{ color: C.textDim, fontSize: 11.5, marginTop: 2, fontFamily: fontMono, letterSpacing: '0.04em' }}>
        {category} · {runs} runs
      </div>
    </div>
    {active && <ChevronRight size={14} color={C.orange} />}
  </div>
  );
};

const ChatBubble = ({ role, children, streaming }: any) => {
  const C = useC();
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: isUser ? C.surface2 : 'transparent',
          border: isUser ? `1px solid ${C.hairline}` : `1px solid ${C.orangeRing}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isUser ? (
          <span style={{ color: C.textMid, fontSize: 11, fontFamily: fontMono }}>JD</span>
        ) : (
          <>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange }} />
            {streaming && (
              <div
                style={{
                  position: 'absolute', inset: -3, borderRadius: 8,
                  border: `1px solid ${C.orange}`, opacity: 0.4,
                  animation: 'qpPulse 1.4s ease-in-out infinite',
                }}
              />
            )}
          </>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ color: C.text, fontSize: 12.5, fontWeight: 500 }}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <MonoLabel>{isUser ? '14:32' : '14:32 · GPT-4O'}</MonoLabel>
        </div>
        <div style={{ color: isUser ? C.textMid : C.text, fontSize: 14, lineHeight: 1.65, letterSpacing: '-0.003em' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DESKTOP MOCK
// ─────────────────────────────────────────────────────────────

function DesktopMock() {
  const C = useC();
  return (
    <div
      style={{
        width: '100%', aspectRatio: '16 / 10',
        background: C.bg, color: C.text, fontFamily: fontSans,
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${C.hairline}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48, borderBottom: `1px solid ${C.hairline2}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 18,
          background: C.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 6, height: 6, background: C.bg, borderRadius: 1 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Aperture</span>
        </div>
        <div style={{ width: 1, height: 18, background: C.hairline }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 6, background: C.surface }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: C.orange + '40' }} />
          <span style={{ fontSize: 12, color: C.textMid }}>Linear · Marketing</span>
          <ChevronDown size={12} color={C.textDim} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.hairline}`, color: C.textMid, fontSize: 11.5 }}>
          <Search size={12} />
          <span>Search everything</span>
          <span style={{ fontFamily: fontMono, fontSize: 10, color: C.textDim, marginLeft: 16 }}>⌘K</span>
        </div>
        <Settings size={15} color={C.textMid} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left rail — playbooks */}
        <div style={{ width: 280, borderRight: `1px solid ${C.hairline2}`, display: 'flex', flexDirection: 'column', background: C.bg }}>
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <MonoLabel>Playbooks · 47</MonoLabel>
              <Plus size={13} color={C.textMid} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              {['All', 'Marketing', 'Sales', 'Ops'].map((t, i) => (
                <span key={t} style={{
                  fontSize: 11, padding: '4px 9px', borderRadius: 4,
                  background: i === 0 ? C.orangeSoft : 'transparent',
                  color: i === 0 ? C.orange : C.textMid,
                  border: i === 0 ? `1px solid ${C.orangeRing}` : `1px solid ${C.hairline2}`,
                  fontWeight: 500,
                }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PlaybookRow num="01" name="Weekly revenue digest" category="STRIPE · QUICKBOOKS" runs="184" />
            <PlaybookRow num="02" name="Instagram content calendar" category="INSTAGRAM · GA4" runs="92" />
            <PlaybookRow num="03" name="Customer interview synth" category="SALESFORCE · HUBSPOT" runs="47" active />
            <PlaybookRow num="04" name="Ad spend vs ROI report" category="META · GA4 · STRIPE" runs="31" />
            <PlaybookRow num="05" name="Reconcile Square ↔ Books" category="SQUARE · QUICKBOOKS" runs="22" />
            <PlaybookRow num="06" name="Win-back lapsed customers" category="HUBSPOT · STRIPE" runs="18" />
            <PlaybookRow num="07" name="Quarterly OKR draft" category="LEADERSHIP" runs="11" />
          </div>
        </div>

        {/* Main canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Thread header */}
          <div style={{ padding: '20px 32px 16px', borderBottom: `1px solid ${C.hairline2}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MonoLabel color={C.orange}>Playbook · 03</MonoLabel>
              <MonoLabel>Step 2 of 4</MonoLabel>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, color: C.text }}>
              Customer interview synthesis
            </h1>
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {['Upload transcripts', 'Theme extraction', 'Quote pull', 'Exec summary'].map((s, i) => (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 4,
                  background: i === 1 ? C.orangeSoft : 'transparent',
                  border: `1px solid ${i < 2 ? C.orangeRing : C.hairline2}`,
                  fontSize: 11.5,
                  color: i < 2 ? C.text : C.textDim,
                }}>
                  {i === 0 && <Check size={11} color={C.success} />}
                  <span style={{ fontFamily: fontMono, fontSize: 10, color: C.textDim }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            {/* Data sources used by this playbook */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <MonoLabel>Live data ·</MonoLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                {INTEGRATIONS.filter(i => ['SF','HS','SQ','ST'].includes(i.key)).map(i => (
                  <IntegrationDot key={i.key} i={i} size={20} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: C.textDim }}>
                Salesforce · HubSpot · Square · Stripe — last sync 2m ago
              </span>
            </div>
          </div>

          {/* Chat scroll */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '24px 32px 8px' }}>
            <ChatBubble role="user">
              Pull the top recurring themes from the 8 transcripts I uploaded. Group by severity and rank by mention count.
            </ChatBubble>
            <ChatBubble role="assistant" streaming>
              <div style={{ marginBottom: 14 }}>
                Across the 8 interviews and cross-referenced against <span style={{ color: C.text, fontWeight: 500 }}>187 Salesforce support cases</span> and <span style={{ color: C.text, fontWeight: 500 }}>last 30d of HubSpot replies</span>, three themes dominate. Weighted by mention count + revenue at risk (Stripe MRR).
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
                {[
                  { label: 'Onboarding friction', count: '34', sub: '$12.4K MRR at risk', tone: C.orange },
                  { label: 'Pricing opacity',    count: '21', sub: '$7.8K MRR at risk',  tone: C.warn },
                  { label: 'Slow exports',       count: '17', sub: '$3.1K MRR at risk',  tone: C.textMid },
                ].map(t => (
                  <div key={t.label} style={{
                    padding: '12px 14px', background: C.surface, border: `1px solid ${C.hairline2}`, borderRadius: 6,
                  }}>
                    <MonoLabel color={t.tone}>{t.count} mentions</MonoLabel>
                    <div style={{ marginTop: 6, fontSize: 13, color: C.text, fontWeight: 500 }}>{t.label}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: C.textDim, fontFamily: fontMono }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </ChatBubble>
          </div>

          {/* Composer */}
          <div style={{ padding: '12px 32px 24px' }}>
            <div style={{
              border: `1px solid ${C.hairline}`, borderRadius: 10, background: C.surface,
              padding: '14px 14px 10px',
            }}>
              <div style={{ color: C.textMid, fontSize: 13.5, minHeight: 22 }}>
                Continue or ask a follow-up…
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: C.textDim }}>
                  <Paperclip size={14} />
                  <Mic size={14} />
                  <span style={{ fontFamily: fontMono, fontSize: 10.5, color: C.textDim, letterSpacing: '0.06em' }}>
                    ⌘↵ TO SEND   ·   / FOR PLAYBOOKS
                  </span>
                </div>
                <button style={{
                  border: 'none', background: C.orange, color: C.onOrange,
                  width: 32, height: 28, borderRadius: 6, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <ArrowUp size={15} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail — memory */}
        <div style={{ width: 248, borderLeft: `1px solid ${C.hairline2}`, padding: '20px 18px', background: C.bg }}>
          {/* Connected sources */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoLabel>Connected · 7 of 8</MonoLabel>
            <Plug size={12} color={C.textMid} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            {INTEGRATIONS.map(i => <IntegrationDot key={i.key} i={i} size={36} />)}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
            Pulling live from Salesforce, Stripe, Shopify, Square, QuickBooks, Instagram, GA4.
          </div>

          <div style={{ height: 1, background: C.hairline2, margin: '20px 0' }} />

          <MonoLabel>Business Memory</MonoLabel>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { k: 'BRAND VOICE', v: 'Direct, no fluff. Sentence case. Avoids "delight", "seamless".' },
              { k: 'MRR · LIVE',  v: '$48,210 — up 12% MoM · synced from Stripe 2m ago.' },
              { k: 'TOP SKU',     v: 'Pro plan · 312 active subs · Shopify + Stripe.' },
              { k: 'ICP',         v: 'Solo founders, $0–500K ARR, B2B SaaS.' },
            ].map(m => (
              <div key={m.k} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.hairline2}` }}>
                <MonoLabel color={C.orange}>{m.k}</MonoLabel>
                <div style={{ color: C.textMid, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{m.v}</div>
              </div>
            ))}
            <button style={{
              background: 'transparent', border: `1px dashed ${C.hairline}`,
              color: C.textMid, fontSize: 12, padding: '10px', borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Plus size={12} /> Connect a source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE MOCK
// ─────────────────────────────────────────────────────────────

function MobileMock() {
  const C = useC();
  return (
    <div
      style={{
        width: 320, height: 660,
        background: '#000', borderRadius: 42, padding: 10,
        border: `1px solid ${C.hairline}`,
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%', height: '100%', background: C.bg, borderRadius: 32,
          overflow: 'hidden', color: C.text, fontFamily: fontSans,
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          width: 90, height: 22, background: '#000', borderRadius: 14, zIndex: 2,
        }} />
        {/* Status bar */}
        <div style={{ padding: '16px 22px 0', display: 'flex', justifyContent: 'space-between', fontFamily: fontMono, fontSize: 11, color: C.textMid }}>
          <span>9:41</span>
          <span style={{ marginRight: 60 }} />
          <span>●●●●</span>
        </div>

        {/* Header */}
        <div style={{ padding: '24px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Menu size={18} color={C.textMid} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: C.orange + '40' }} />
            <span style={{ fontSize: 12, color: C.textMid }}>Marketing</span>
            <ChevronDown size={11} color={C.textDim} />
          </div>
          <MoreHorizontal size={18} color={C.textMid} />
        </div>

        {/* Active playbook strip */}
        <div style={{ margin: '8px 14px', padding: '12px 14px', background: C.surface, border: `1px solid ${C.hairline2}`, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MonoLabel color={C.orange}>Playbook · 03</MonoLabel>
            <span style={{ flex: 1 }} />
            <MonoLabel>2/4</MonoLabel>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text, letterSpacing: '-0.01em' }}>
            Customer interview synthesis
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {[1, 1, 0, 0].map((v, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: v ? C.orange : C.hairline }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            {INTEGRATIONS.filter(i => ['SF','HS','SQ','ST'].includes(i.key)).map(i => (
              <IntegrationDot key={i.key} i={i} size={18} />
            ))}
            <span style={{ fontSize: 10.5, color: C.textDim, fontFamily: fontMono, letterSpacing: '0.04em' }}>
              LIVE · 2M AGO
            </span>
          </div>
        </div>

        {/* Connected sources strip */}
        <div style={{ padding: '0 14px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <MonoLabel>Connected · 7 of 8</MonoLabel>
            <span style={{ fontSize: 10.5, color: C.orange, fontFamily: fontMono }}>MANAGE</span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {INTEGRATIONS.map(i => <IntegrationDot key={i.key} i={i} size={32} />)}
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '8px 18px 4px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: C.surface2, border: `1px solid ${C.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontFamily: fontMono, color: C.textMid }}>JD</span>
              </div>
              <span style={{ fontSize: 11.5, color: C.text, fontWeight: 500 }}>You</span>
              <MonoLabel>14:32</MonoLabel>
            </div>
            <div style={{ color: C.textMid, fontSize: 13, lineHeight: 1.55 }}>
              Pull recurring themes from the 8 transcripts.
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${C.orangeRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.orange }} />
                <div style={{ position: 'absolute', inset: -3, borderRadius: 7, border: `1px solid ${C.orange}`, opacity: 0.4, animation: 'qpPulse 1.4s ease-in-out infinite' }} />
              </div>
              <span style={{ fontSize: 11.5, color: C.text, fontWeight: 500 }}>Assistant</span>
              <MonoLabel>GPT-4O</MonoLabel>
            </div>
            <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
              Three themes dominate, weighted by mention count and emotional intensity.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Onboarding friction', count: '34', tone: C.orange },
                { label: 'Pricing opacity', count: '21', tone: C.warn },
                { label: 'Slow exports', count: '17', tone: C.textMid },
              ].map(t => (
                <div key={t.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: C.surface, border: `1px solid ${C.hairline2}`, borderRadius: 6,
                }}>
                  <span style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{t.label}</span>
                  <MonoLabel color={t.tone}>{t.count}</MonoLabel>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Composer */}
        <div style={{ padding: '8px 14px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 22,
          }}>
            <Plus size={16} color={C.textMid} />
            <span style={{ flex: 1, color: C.textDim, fontSize: 13 }}>Message…</span>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: C.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowUp size={14} strokeWidth={2.6} color={C.onOrange} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          borderTop: `1px solid ${C.hairline2}`, padding: '10px 0 18px',
        }}>
          {[
            { Icon: MessageSquare, label: 'Chat', active: true },
            { Icon: Layers,        label: 'Playbooks' },
            { Icon: Database,      label: 'Memory' },
          ].map(({ Icon, label, active }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Icon size={18} color={active ? C.orange : C.textDim} strokeWidth={active ? 2.2 : 1.7} />
              <span style={{ fontSize: 10, color: active ? C.text : C.textDim, fontFamily: fontMono, letterSpacing: '0.05em' }}>
                {label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function JasperMock() {
  return (
    <div style={{ padding: 24, background: '#F6F6F7', minHeight: '100vh' }}>
      <style>{`
        @keyframes qpPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.08); }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Visual Direction · v1
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '6px 0 4px', color: '#0A0A0A' }}>
            Quiet Power
          </h1>
          <p style={{ color: '#555', fontSize: 14, margin: 0 }}>
            Dark canvas · generous whitespace · Inter + JetBrains Mono · Rilo orange as the only accent.
            Inspired by ElevenLabs operator-first calm.
          </p>
        </div>

        {/* Desktop */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              01 · Desktop — 1440×900
            </div>
          </div>
          <DesktopMock />
        </div>

        {/* Mobile */}
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            02 · Mobile — 390×844
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', background: '#1A1A1A', borderRadius: 12 }}>
            <MobileMock />
          </div>
        </div>

        {/* Token strip */}
        <div style={{ marginTop: 36, padding: 20, background: '#fff', border: '1px solid #E5E5E5', borderRadius: 10 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Design tokens
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {[
              ['BG',        C.bg],
              ['Surface',   C.surface],
              ['Hairline',  C.hairline],
              ['Text',      C.text],
              ['Text Mid',  C.textMid],
              ['Text Dim',  C.textDim],
              ['Orange',    C.orange],
              ['Success',   C.success],
              ['Warn',      C.warn],
            ].map(([name, hex]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: hex, border: '1px solid #E5E5E5' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#0A0A0A' }}>{name}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 10.5, color: '#666' }}>{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}