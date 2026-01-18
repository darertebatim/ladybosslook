import { RoutineTemplatesManager } from '@/components/admin/RoutineTemplatesManager';

export default function Routines() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Routine Templates</h1>
        <p className="text-muted-foreground">
          Manage routine suggestions and templates for the Inspire page
        </p>
      </div>

      <RoutineTemplatesManager />
    </div>
  );
}
