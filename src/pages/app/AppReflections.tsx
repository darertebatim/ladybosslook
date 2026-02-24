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
              <button
                key={r.id}
                onClick={() => navigate(`/app/reflections/${r.id}`)}
                className="w-full rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97] relative min-h-[140px] flex items-end"
                style={{ backgroundColor: '#f5d0e0' }}
              >
                <div className="p-4 pr-28 z-10">
                  <p className="font-bold text-base leading-tight">{r.title}</p>
                  {r.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.subtitle}</p>}
                </div>
                {r.cover_image_url && (
                  <img
                    src={r.cover_image_url}
                    alt=""
                    className="absolute right-0 bottom-0 h-full w-32 object-cover object-center"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">All</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {all.map((r) => (
              <ReflectionRow key={r.id} reflection={r} onClick={() => navigate(`/app/reflections/${r.id}`)} />
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

function ReflectionRow({ reflection, onClick }: { reflection: Reflection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-4 text-left transition-transform active:scale-[0.98]"
    >
      {reflection.cover_image_url ? (
        <img
          src={reflection.cover_image_url}
          alt={reflection.title}
          className="h-24 w-24 rounded-2xl object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0">📝</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base leading-tight">{reflection.title}</p>
        {reflection.subtitle && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reflection.subtitle}</p>
        )}
      </div>
    </button>
  );
}
