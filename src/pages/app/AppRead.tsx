import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedContent, useReadingUserProgress } from '@/hooks/useReading';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

export default function AppRead() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'story' | 'lesson'>('story');
  const { data: content = [], isLoading } = usePublishedContent(activeTab);
  const { data: progress = [] } = useReadingUserProgress();

  const getProgress = (contentId: string) => progress.find(p => p.content_id === contentId);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Read
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Stories & lessons for your mind</p>
      </div>

      {/* Pill Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setActiveTab('story')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'story'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Stories
        </button>
        <button
          onClick={() => setActiveTab('lesson')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'lesson'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Lessons
        </button>
      </div>

      {/* Content List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : content.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No {activeTab === 'story' ? 'stories' : 'lessons'} available yet</p>
          </div>
        ) : (
          content.map(item => {
            const prog = getProgress(item.id);
            const isCompleted = prog?.completed;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/app/read/${item.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl transition-transform active:scale-[0.98] text-left"
                style={{ backgroundColor: item.theme_color || '#F0E3FF' }}
              >
                {/* Cover placeholder */}
                <div
                  className="w-20 h-[53px] rounded-xl flex-shrink-0 flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    backgroundImage: item.cover_url ? `url(${item.cover_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!item.cover_url && (item.type === 'story' ? '📖' : '📚')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.reading_time_minutes} min
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                    {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
