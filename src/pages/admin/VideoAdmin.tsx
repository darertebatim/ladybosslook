import { VideoPlaylistManager } from '@/components/admin/VideoPlaylistManager';
import { VideoManager } from '@/components/admin/VideoManager';

export default function VideoAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Video Management</h2>
        <p className="text-muted-foreground">Manage video content, playlists, and tracks</p>
      </div>
      <VideoPlaylistManager />
      <VideoManager />
    </div>
  );
}
