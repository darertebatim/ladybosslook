import { useNavigate } from 'react-router-dom';
import { useReflections, Reflection } from '@/hooks/useReflections';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppReflections() {
  const navigate = useNavigate();
  const { data: reflections, isLoading } = useReflections();

  const featured = reflections?.filter((r) => r.is_featured) || [];
  const all = reflections || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/app/reflections/notes')}
            className="active:scale-95 transition-transform p-1"
          >
            <BookOpen className="h-5 w-5" />
          </button>
        </div>
        <h1 className="text-2xl font-bold">Reflection</h1>
        <p className="text-muted-foreground text-sm">Find ways to be happier & healthier</p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">For you</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((r) => (
              <ReflectionCard key={r.id} reflection={r} onClick={() => navigate(`/app/reflections/${r.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* All */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">All</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {all.map((r) => (
              <ReflectionCard key={r.id} reflection={r} onClick={() => navigate(`/app/reflections/${r.id}`)} />
            ))}
          </div>
        )}
        {!isLoading && all.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No reflections available yet.</p>
        )}
      </div>
    </div>
  );
}

function ReflectionCard({ reflection, onClick }: { reflection: Reflection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl overflow-hidden bg-card border text-left transition-transform active:scale-[0.97]"
    >
      {reflection.cover_image_url ? (
        <img
          src={reflection.cover_image_url}
          alt={reflection.title}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center text-3xl">📝</div>
      )}
      <div className="p-2">
        <p className="font-semibold text-sm leading-tight line-clamp-1">{reflection.title}</p>
        {reflection.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{reflection.subtitle}</p>
        )}
      </div>
    </button>
  );
}
