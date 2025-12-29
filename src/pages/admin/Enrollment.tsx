import { QuickEnrollUser } from '@/components/admin/QuickEnrollUser';
import { ProgramEnrollmentManager } from '@/components/admin/ProgramEnrollmentManager';

export default function Enrollment() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enrollment Management</h2>
        <p className="text-muted-foreground">Manage course enrollments and round assignments</p>
      </div>

      <QuickEnrollUser />
      <ProgramEnrollmentManager />
    </div>
  );
}
