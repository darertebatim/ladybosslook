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
