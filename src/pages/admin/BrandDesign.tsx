import appIcon from '@/assets/app-icon.png';

const ColorSwatch = ({ label, cssVar, hsl, className }: { label: string; cssVar: string; hsl: string; className?: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-lg border shadow-sm shrink-0 ${className || ''}`}
      style={{ backgroundColor: `hsl(${hsl})` }}
    />
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{label}</p>
      <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
      <p className="text-xs text-muted-foreground font-mono">hsl({hsl})</p>
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

export default function BrandDesign() {
  return (
    <div className="p-6 max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Brand & Design System</h1>
        <p className="text-muted-foreground text-sm mt-1">The definitive source for all Simora color palettes and design tokens</p>
      </div>

      {/* Logo */}
      <Section title="App Icon & Logo">
        <div className="flex items-center gap-6">
          <img src={appIcon} alt="Simora app icon" className="w-24 h-24 rounded-2xl shadow-md" />
          <div>
            <p className="font-semibold text-foreground">Simora</p>
            <p className="text-sm text-muted-foreground">Phoenix icon — warm coral, gold, and magenta gradient</p>
          </div>
        </div>
      </Section>

      {/* Logo Colors */}
      <Section title="Logo Colors" description="Extracted from the phoenix app icon">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Coral Red" cssVar="Logo primary" hsl="10, 80%, 55%" />
          <ColorSwatch label="Golden Yellow" cssVar="Logo highlight" hsl="40, 90%, 60%" />
          <ColorSwatch label="Magenta Pink" cssVar="Logo accent" hsl="340, 70%, 50%" />
          <ColorSwatch label="Deep Red" cssVar="Logo shadow" hsl="5, 75%, 42%" />
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
          <ColorSwatch label="Background" cssVar="--background" hsl="0, 0%, 100%" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hsl="0, 0%, 9%" />
          <ColorSwatch label="Primary" cssVar="--primary" hsl="0, 0%, 9%" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hsl="0, 0%, 100%" />
          <ColorSwatch label="Secondary" cssVar="--secondary" hsl="0, 0%, 96%" />
          <ColorSwatch label="Muted" cssVar="--muted" hsl="0, 0%, 96%" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hsl="0, 0%, 45%" />
          <ColorSwatch label="Border" cssVar="--border" hsl="0, 0%, 90%" />
        </div>
      </Section>

      <Section title="App — Core Colors (Dark)" description="Inverted for dark mode">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hsl="0, 0%, 4%" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hsl="0, 0%, 98%" />
          <ColorSwatch label="Primary" cssVar="--primary" hsl="0, 0%, 98%" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hsl="0, 0%, 4%" />
          <ColorSwatch label="Secondary" cssVar="--secondary" hsl="0, 0%, 12%" />
          <ColorSwatch label="Muted" cssVar="--muted" hsl="0, 0%, 12%" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hsl="0, 0%, 55%" />
          <ColorSwatch label="Border" cssVar="--border" hsl="0, 0%, 15%" />
        </div>
      </Section>

      <Section title="App — Status Colors" description="Consistent across light/dark modes">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Success" cssVar="--success" hsl="142, 71%, 45%" />
          <ColorSwatch label="Destructive" cssVar="--destructive" hsl="0, 84%, 60%" />
          <ColorSwatch label="Chip Lavender" cssVar="--chip-lavender" hsl="268, 68%, 85%" />
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
          <ColorSwatch label="Primary" cssVar="--primary" hsl="10, 80%, 55%" />
          <ColorSwatch label="Primary Light" cssVar="--primary-light" hsl="15, 85%, 62%" />
          <ColorSwatch label="Primary Dark" cssVar="--primary-dark" hsl="5, 75%, 42%" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hsl="0, 0%, 100%" />
        </div>
      </Section>

      <Section title="Admin — Secondary & Accent">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Secondary (Gold)" cssVar="--secondary" hsl="45, 90%, 60%" />
          <ColorSwatch label="Secondary Light" cssVar="--secondary-light" hsl="45, 95%, 70%" />
          <ColorSwatch label="Accent (Rose)" cssVar="--accent" hsl="330, 50%, 85%" />
        </div>
      </Section>

      <Section title="Admin — Status & CTA">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Success" cssVar="--success" hsl="142, 76%, 36%" />
          <ColorSwatch label="Destructive" cssVar="--destructive" hsl="0, 75%, 55%" />
          <ColorSwatch label="Warning" cssVar="--warning" hsl="38, 92%, 50%" />
          <ColorSwatch label="Urgency" cssVar="--urgency" hsl="15, 90%, 55%" />
          <ColorSwatch label="CTA Primary" cssVar="--cta-primary" hsl="10, 80%, 58%" />
          <ColorSwatch label="CTA Urgent" cssVar="--cta-urgent" hsl="345, 85%, 55%" />
        </div>
      </Section>

      <Section title="Admin — Surfaces">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hsl="0, 0%, 100%" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hsl="230, 15%, 15%" />
          <ColorSwatch label="Card" cssVar="--card" hsl="0, 0%, 100%" />
          <ColorSwatch label="Muted" cssVar="--muted" hsl="320, 15%, 95%" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hsl="230, 8%, 55%" />
          <ColorSwatch label="Border" cssVar="--border" hsl="320, 20%, 90%" />
        </div>
      </Section>

      {/* Planner Palette */}
      <Section title="Planner Action Palette" description="7 pastel colors used across the daily planner, action builder, and routine cards">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Pink" cssVar="planner-pink" hsl="334, 100%, 92%" className="!bg-[#FFD6E8]" />
          <ColorSwatch label="Peach" cssVar="planner-peach" hsl="33, 100%, 88%" className="!bg-[#FFE4C4]" />
          <ColorSwatch label="Yellow" cssVar="planner-yellow" hsl="54, 100%, 81%" className="!bg-[#FFF59D]" />
          <ColorSwatch label="Lime" cssVar="planner-lime" hsl="70, 82%, 80%" className="!bg-[#E8F5A3]" />
          <ColorSwatch label="Sky" cssVar="planner-sky" hsl="200, 88%, 88%" className="!bg-[#C5E8FA]" />
          <ColorSwatch label="Mint" cssVar="planner-mint" hsl="163, 80%, 84%" className="!bg-[#B8F5E4]" />
          <ColorSwatch label="Lavender" cssVar="planner-lavender" hsl="273, 75%, 90%" className="!bg-[#E8D4F8]" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Hex values:</span> Pink #FFD6E8 · Peach #FFE4C4 · Yellow #FFF59D · Lime #E8F5A3 · Sky #C5E8FA · Mint #B8F5E4 · Lavender #E8D4F8</p>
          <p><span className="font-medium">Aliases:</span> red → pink · orange → peach · green → lime · blue → sky · purple → lavender</p>
        </div>
      </Section>

      <Section title="Planner Secondary Palette" description="Heavier/darker variants used for schedule strips and card footers in the planner">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Pink Dark" cssVar="planner-pink-dark" hsl="332, 100%, 86%" className="!bg-[#FFB8D9]" />
          <ColorSwatch label="Peach Dark" cssVar="planner-peach-dark" hsl="30, 100%, 82%" className="!bg-[#FFD1A3]" />
          <ColorSwatch label="Yellow Dark" cssVar="planner-yellow-dark" hsl="50, 100%, 75%" className="!bg-[#FFE97D]" />
          <ColorSwatch label="Lime Dark" cssVar="planner-lime-dark" hsl="73, 73%, 72%" className="!bg-[#D4EB82]" />
          <ColorSwatch label="Sky Dark" cssVar="planner-sky-dark" hsl="202, 78%, 79%" className="!bg-[#A3D5F2]" />
          <ColorSwatch label="Mint Dark" cssVar="planner-mint-dark" hsl="162, 69%, 74%" className="!bg-[#8EECD0]" />
          <ColorSwatch label="Lavender Dark" cssVar="planner-lavender-dark" hsl="270, 67%, 83%" className="!bg-[#D4B8F0]" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Hex values:</span> Pink #FFB8D9 · Peach #FFD1A3 · Yellow #FFE97D · Lime #D4EB82 · Sky #A3D5F2 · Mint #8EECD0 · Lavender #D4B8F0</p>
          <p><span className="font-medium">Usage:</span> Bottom schedule strip on task cards, heavier accent areas, hover states</p>
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
            <div className="h-20 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 20%))' }} />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-primary (app)</p>
          </div>
          <div>
            <div className="h-20 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 25%) 100%)' }} />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-hero (app)</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
