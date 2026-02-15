import appIcon from '@/assets/app-icon.png';

const ColorSwatch = ({ label, cssVar, hsl }: { label: string; cssVar: string; hsl: string }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-12 h-12 rounded-lg border shadow-sm shrink-0"
      style={{ backgroundColor: `hsl(${hsl})` }}
    />
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{label}</p>
      <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
      <p className="text-xs text-muted-foreground font-mono">hsl({hsl})</p>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground border-b pb-2">{title}</h2>
    {children}
  </div>
);

export default function BrandDesign() {
  return (
    <div className="p-6 max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Brand & Design System</h1>
        <p className="text-muted-foreground text-sm mt-1">Color palettes, logo, and design tokens used across Simora</p>
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
      <Section title="Logo Colors">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Coral Red" cssVar="Logo primary" hsl="10, 80%, 55%" />
          <ColorSwatch label="Golden Yellow" cssVar="Logo highlight" hsl="40, 90%, 60%" />
          <ColorSwatch label="Magenta Pink" cssVar="Logo accent" hsl="340, 70%, 50%" />
          <ColorSwatch label="Deep Red" cssVar="Logo shadow" hsl="5, 75%, 42%" />
        </div>
      </Section>

      {/* Primary Action Palette */}
      <Section title="Primary Action Palette">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Primary" cssVar="--primary" hsl="10, 80%, 55%" />
          <ColorSwatch label="Primary Light" cssVar="--primary-light" hsl="15, 85%, 62%" />
          <ColorSwatch label="Primary Dark" cssVar="--primary-dark" hsl="5, 75%, 42%" />
          <ColorSwatch label="Primary Foreground" cssVar="--primary-foreground" hsl="0, 0%, 100%" />
        </div>
      </Section>

      {/* Secondary */}
      <Section title="Secondary Palette">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Secondary (Gold)" cssVar="--secondary" hsl="45, 90%, 60%" />
          <ColorSwatch label="Secondary Light" cssVar="--secondary-light" hsl="45, 95%, 70%" />
          <ColorSwatch label="Secondary Dark" cssVar="--secondary-dark" hsl="40, 85%, 45%" />
        </div>
      </Section>

      {/* Accent & Status */}
      <Section title="Accent & Status Colors">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Accent (Rose)" cssVar="--accent" hsl="330, 50%, 85%" />
          <ColorSwatch label="Success" cssVar="--success" hsl="142, 76%, 36%" />
          <ColorSwatch label="Destructive" cssVar="--destructive" hsl="0, 75%, 55%" />
          <ColorSwatch label="Warning" cssVar="--warning" hsl="38, 92%, 50%" />
          <ColorSwatch label="Urgency" cssVar="--urgency" hsl="15, 90%, 55%" />
        </div>
      </Section>

      {/* Surfaces */}
      <Section title="Surface & Text Colors">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="Background" cssVar="--background" hsl="0, 0%, 100%" />
          <ColorSwatch label="Foreground" cssVar="--foreground" hsl="230, 15%, 15%" />
          <ColorSwatch label="Card" cssVar="--card" hsl="0, 0%, 100%" />
          <ColorSwatch label="Muted" cssVar="--muted" hsl="320, 15%, 95%" />
          <ColorSwatch label="Muted Foreground" cssVar="--muted-foreground" hsl="230, 8%, 55%" />
          <ColorSwatch label="Border" cssVar="--border" hsl="320, 20%, 90%" />
        </div>
      </Section>

      {/* CTA Colors */}
      <Section title="CTA & Conversion Colors">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorSwatch label="CTA Primary" cssVar="--cta-primary" hsl="10, 80%, 58%" />
          <ColorSwatch label="CTA Hover" cssVar="--cta-primary-hover" hsl="10, 85%, 63%" />
          <ColorSwatch label="CTA Urgent" cssVar="--cta-urgent" hsl="345, 85%, 55%" />
        </div>
      </Section>

      {/* Gradients Preview */}
      <Section title="Gradients">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="h-20 rounded-xl bg-gradient-hero" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-hero</p>
          </div>
          <div>
            <div className="h-20 rounded-xl bg-gradient-text" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-text</p>
          </div>
          <div>
            <div className="h-20 rounded-xl bg-gradient-accent" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-accent</p>
          </div>
          <div>
            <div className="h-20 rounded-xl bg-gradient-luxury" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">--gradient-luxury</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
