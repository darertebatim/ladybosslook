import { AudioManager } from '@/components/admin/AudioManager';

export default function Audio() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audio Management</h2>
        <p className="text-muted-foreground">Manage audio content, playlists, and tracks</p>
      </div>
      <AudioManager />
    </div>
  );
}
