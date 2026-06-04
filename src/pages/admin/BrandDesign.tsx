import { NavLink } from 'react-router-dom';
import appIcon from '@/assets/app-icon.png';

const ColorSwatch = ({ label, cssVar, hex, className }: { label: string; cssVar: string; hex: string; className?: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-lg border shadow-sm shrink-0 ${className || ''}`}
      style={{ backgroundColor: hex }}
    />
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{label}</p>
      <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
      <p className="text-xs text-muted-foreground font-mono">{hex}</p>
    </div>
  </div>
);

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-foreground border-b pb-2">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

const BrandTabs = () => (
  <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
    <NavLink
      to="/admin/brand"
      end
      className={({ isActive }) =>
        `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
      }
    >
      Design System
    </NavLink>
    <NavLink
      to="/admin/brand/mock"
      className={({ isActive }) =>
        `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
      }
    >
      Mock
    </NavLink>
  </div>
);

export default function BrandDesign() {
  return (
    <div className="p-6 max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Brand & Design System</h1>
        <p className="text-muted-foreground text-sm mt-1">The definitive source for all Rilo color palettes and design tokens</p>
        <div className="mt-4">
          <BrandTabs />
        </div>
      </div>

      {/* Logo */}
      <Section title="App Icon & Logo">
        <div className="flex items-center gap-6">
          <img src={appIcon} alt="Rilo app icon" className="w-24 h-24 rounded-2xl shadow-md" />
          <div>
            <p className="font-semibold text-foreground">Rilo</p>
            <p className="text-sm text-muted-foreground">Phoenix icon — warm coral, gold, and magenta gradient</p>
          </div>
        </div>
      </Section>

      {/* Logo Colors */}
      <Section title="Logo Colors" description="Extracted from the phoenix app icon">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Coral Red" cssVar="Logo primary" hex="#D94B2B" />
          <ColorSwatch label="Golden Yellow" cssVar="Logo highlight" hex="#F5A623" />
          <ColorSwatch label="Magenta Pink" cssVar="Logo accent" hex="#C2255C" />
          <ColorSwatch label="Deep Red" cssVar="Logo shadow" hex="#A63520" />
        </div>
      </Section>

      {/* ==================== APP THEME ==================== */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          📱 App Theme <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full">.app-theme</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Used on all /app/* pages — Black & White minimalist system</p>
      </div>

      <Section title="App — Core Colors (Light)" description="Clean black-on-white for the mobile app experience">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hex="#FFFFFF" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hex="#171717" />
          <ColorSwatch label="Primary" cssVar="--primary" hex="#171717" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hex="#FFFFFF" />
          <ColorSwatch label="Secondary" cssVar="--secondary" hex="#F5F5F5" />
          <ColorSwatch label="Muted" cssVar="--muted" hex="#F5F5F5" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hex="#737373" />
          <ColorSwatch label="Border" cssVar="--border" hex="#E6E6E6" />
        </div>
      </Section>

      <Section title="App — Core Colors (Dark)" description="Inverted for dark mode">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hex="#0A0A0A" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hex="#FAFAFA" />
          <ColorSwatch label="Primary" cssVar="--primary" hex="#FAFAFA" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hex="#0A0A0A" />
          <ColorSwatch label="Secondary" cssVar="--secondary" hex="#1F1F1F" />
          <ColorSwatch label="Muted" cssVar="--muted" hex="#1F1F1F" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hex="#8C8C8C" />
          <ColorSwatch label="Border" cssVar="--border" hex="#262626" />
        </div>
      </Section>

      <Section title="App — Status Colors" description="Consistent across light/dark modes">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Success" cssVar="--success" hex="#22C55E" />
          <ColorSwatch label="Destructive" cssVar="--destructive" hex="#EF4444" />
          <ColorSwatch label="Chip Lavender" cssVar="--chip-lavender" hex="#C4A1E0" />
        </div>
      </Section>

      {/* ==================== ADMIN / WEB THEME ==================== */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          🖥️ Admin & Web Theme <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full">:root</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Used on admin panel and marketing/web pages — warm coral palette from the logo</p>
      </div>

      <Section title="Admin — Primary Action Palette" description="Phoenix Coral from the app icon">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Primary" cssVar="--primary" hex="#E6512E" />
          <ColorSwatch label="Primary Light" cssVar="--primary-light" hex="#EE7B4F" />
          <ColorSwatch label="Primary Dark" cssVar="--primary-dark" hex="#A63D1F" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hex="#FFFFFF" />
        </div>
      </Section>

      <Section title="Admin — Secondary & Accent">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Secondary (Gold)" cssVar="--secondary" hex="#F0C030" />
          <ColorSwatch label="Secondary Light" cssVar="--secondary-light" hex="#F5D65C" />
          <ColorSwatch label="Accent (Rose)" cssVar="--accent" hex="#D9B3C7" />
        </div>
      </Section>

      <Section title="Admin — Status & CTA">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Success" cssVar="--success" hex="#1D9A50" />
          <ColorSwatch label="Destructive" cssVar="--destructive" hex="#D94438" />
          <ColorSwatch label="Warning" cssVar="--warning" hex="#F5A300" />
          <ColorSwatch label="Urgency" cssVar="--urgency" hex="#ED5C1E" />
          <ColorSwatch label="CTA Primary" cssVar="--cta-primary" hex="#EB5E33" />
          <ColorSwatch label="CTA Urgent" cssVar="--cta-urgent" hex="#E62B5E" />
        </div>
      </Section>

      <Section title="Admin — Surfaces">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hex="#FFFFFF" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hex="#222838" />
          <ColorSwatch label="Card" cssVar="--card" hex="#FFFFFF" />
          <ColorSwatch label="Muted" cssVar="--muted" hex="#F2ECF0" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hex="#7E818D" />
          <ColorSwatch label="Border" cssVar="--border" hex="#E8D6E0" />
        </div>
      </Section>

      {/* Planner Palette */}
      <Section title="Planner Action Palette" description="7 pastel colors used across the daily planner, action builder, and routine cards">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Pink" cssVar="planner-pink" hex="#FFE0F5" />
          <ColorSwatch label="Peach" cssVar="planner-peach" hex="#FFE6C9" />
          <ColorSwatch label="Yellow" cssVar="planner-yellow" hex="#FFF492" />
          <ColorSwatch label="Lime" cssVar="planner-lime" hex="#E2F9F0" />
          <ColorSwatch label="Sky" cssVar="planner-sky" hex="#D7E9FF" />
          <ColorSwatch label="Mint" cssVar="planner-mint" hex="#E0FBB8" />
          <ColorSwatch label="Lavender" cssVar="planner-lavender" hex="#F0E3FF" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Aliases:</span> red → pink · orange → peach · green → lime · blue → sky · purple → lavender</p>
        </div>
      </Section>

      <Section title="Planner Secondary Palette" description="Heavier/darker variants used for schedule strips and card footers in the planner">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Pink Dark" cssVar="planner-pink-dark" hex="#FFC2EA" />
          <ColorSwatch label="Peach Dark" cssVar="planner-peach-dark" hex="#FFD2A1" />
          <ColorSwatch label="Yellow Dark" cssVar="planner-yellow-dark" hex="#FFEA4E" />
          <ColorSwatch label="Lime Dark" cssVar="planner-lime-dark" hex="#C3F1E1" />
          <ColorSwatch label="Sky Dark" cssVar="planner-sky-dark" hex="#B9D6FF" />
          <ColorSwatch label="Mint Dark" cssVar="planner-mint-dark" hex="#C9F588" />
          <ColorSwatch label="Lavender Dark" cssVar="planner-lavender-dark" hex="#DEC1FF" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Usage:</span> Bottom schedule strip on task cards, heavier accent areas, hover states</p>
        </div>
      </Section>

      <Section title="Planner Dark Mode Palette" description="Deep jewel-toned card backgrounds for dark mode — retains color identity without harsh contrast">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Peach Dark" cssVar="planner-peach-dm" hex="#3D2A1A" />
          <ColorSwatch label="Mint Dark" cssVar="planner-mint-dm" hex="#1A2E26" />
          <ColorSwatch label="Lavender Dark" cssVar="planner-lavender-dm" hex="#2A1F3A" />
          <ColorSwatch label="Yellow Dark" cssVar="planner-yellow-dm" hex="#3A3010" />
          <ColorSwatch label="Pink Dark" cssVar="planner-pink-dm" hex="#3A1A2A" />
          <ColorSwatch label="Sky Dark" cssVar="planner-sky-dm" hex="#1A2638" />
          <ColorSwatch label="Lime Dark" cssVar="planner-lime-dm" hex="#1E3020" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Usage:</span> Task card backgrounds in dark mode — subtle tinted surfaces that hint at their light-mode color</p>
        </div>
      </Section>

      {/* ==================== NEW APP ORANGE PALETTE ==================== */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          🍊 App Orange Palette <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full">proposal</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Warm orange system derived from the phoenix icon and planner pastels — for future app theming</p>
      </div>

      <Section title="Orange — Primary Scale" description="Core orange ramp from the phoenix coral icon colors">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Orange 50" cssVar="--orange-50" hex="#FFF4ED" />
          <ColorSwatch label="Orange 100" cssVar="--orange-100" hex="#FFE6D2" />
          <ColorSwatch label="Orange 200" cssVar="--orange-200" hex="#FFD2A1" />
          <ColorSwatch label="Orange 300" cssVar="--orange-300" hex="#FFB870" />
          <ColorSwatch label="Orange 400" cssVar="--orange-400" hex="#F5A623" />
          <ColorSwatch label="Orange 500" cssVar="--orange-500" hex="#EB5E33" />
          <ColorSwatch label="Orange 600" cssVar="--orange-600" hex="#D94B2B" />
          <ColorSwatch label="Orange 700" cssVar="--orange-700" hex="#A63520" />
          <ColorSwatch label="Orange 800" cssVar="--orange-800" hex="#7A2818" />
          <ColorSwatch label="Orange 900" cssVar="--orange-900" hex="#4D1A10" />
        </div>
      </Section>

      <Section title="Orange — Soft Tints" description="Pulled from planner peach, yellow, and pink pastels for backgrounds & cards">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Peach Tint" cssVar="--orange-peach" hex="#FFE6C9" />
          <ColorSwatch label="Peach Mid" cssVar="--orange-peach-mid" hex="#FFD2A1" />
          <ColorSwatch label="Yellow Tint" cssVar="--orange-yellow" hex="#FFF492" />
          <ColorSwatch label="Yellow Mid" cssVar="--orange-yellow-mid" hex="#FFEA4E" />
          <ColorSwatch label="Pink Tint" cssVar="--orange-pink" hex="#FFE0F5" />
          <ColorSwatch label="Pink Mid" cssVar="--orange-pink-mid" hex="#FFC2EA" />
        </div>
      </Section>

      <Section title="Orange — Semantic Tokens" description="Proposed token mapping for an orange-themed app">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Primary" cssVar="--primary" hex="#EB5E33" />
          <ColorSwatch label="Primary Light" cssVar="--primary-light" hex="#F5A623" />
          <ColorSwatch label="Primary Dark" cssVar="--primary-dark" hex="#A63520" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hex="#FFFFFF" />
          <ColorSwatch label="Accent Warm" cssVar="--accent-warm" hex="#FFE6C9" />
          <ColorSwatch label="Accent Rose" cssVar="--accent-rose" hex="#C2255C" />
          <ColorSwatch label="Surface Warm" cssVar="--surface-warm" hex="#FFF4ED" />
          <ColorSwatch label="Surface Peach" cssVar="--surface-peach" hex="#FFE6C9" />
        </div>
      </Section>

      {/* Gradients */}
      <Section title="Gradients">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="h-20 rounded-xl bg-gradient-hero" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-hero (admin)</p>
          </div>
          <div>
            <div className="h-20 rounded-xl bg-gradient-text" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-text (admin)</p>
          </div>
          <div>
            <div className="h-20 rounded-xl" style={{ background: 'linear-gradient(135deg, #171717, #333333)' }} />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-primary (app)</p>
          </div>
          <div>
            <div className="h-20 rounded-xl" style={{ background: 'linear-gradient(135deg, #171717 0%, #404040 100%)' }} />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-hero (app)</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
