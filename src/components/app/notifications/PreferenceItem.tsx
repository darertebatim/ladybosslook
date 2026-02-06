import { Switch } from '@/components/ui/switch';

interface PreferenceItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PreferenceItem({ 
  icon, 
  label, 
  description, 
  checked, 
  onCheckedChange, 
  disabled 
}: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
