import { Link } from 'react-router-dom';
import { Headphones, BookOpen, Users, Sparkles } from 'lucide-react';

export function QuickActionsGrid() {
  const actions = [
    {
      icon: Headphones,
      label: 'Listen',
      to: '/app/player',
      bgColor: 'bg-[#D6E6FC]', // sky
      iconColor: 'text-blue-600',
    },
    {
      icon: BookOpen,
      label: 'Journal',
      to: '/app/journal',
      bgColor: 'bg-[#FAE5C5]', // peach
      iconColor: 'text-orange-600',
    },
    {
      icon: Users,
      label: 'Channels',
      to: '/app/channels',
      bgColor: 'bg-[#E6D9FC]', // lavender
      iconColor: 'text-violet-600',
    },
    {
      icon: Sparkles,
      label: 'Routines',
      to: '/app/routines',
      bgColor: 'bg-[#D3F2EA]', // mint
      iconColor: 'text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <Link
          key={index}
          to={action.to}
          className="flex flex-col items-center gap-2 group"
        >
          <div 
            className={`w-14 h-14 rounded-2xl ${action.bgColor} flex items-center justify-center transition-transform group-active:scale-95 shadow-sm`}
          >
            <action.icon className={`h-6 w-6 ${action.iconColor}`} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
