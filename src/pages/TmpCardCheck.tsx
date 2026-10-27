import { EnrolledProgramCard } from "@/components/app/EnrolledProgramCard";

const mk = (id: string, name: string, round: string, status: string) => ({
  id,
  course_name: name,
  program_slug: "casigads",
  status,
  program_rounds: {
    id: `r-${id}`,
    round_name: round,
    status,
    first_session_date: new Date(Date.now() + 3 * 864e5).toISOString(),
    important_message: "سلام، به دوره «جذب مشتری» خوش اومدین. اینجا در سه قدم جلو می‌ریم.",
  },
});

export default function TmpCardCheck() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-3">
      <EnrolledProgramCard
        enrollment={mk("1", "Costumer Acquisition جذب مشتری", "Customer Acquisition 3", "active")}
        hasNotification
      />
      <EnrolledProgramCard
        enrollment={mk("2", "PowerFree قدرت دو زبانه", "PowerFree Round 2", "upcoming")}
      />
      <EnrolledProgramCard enrollment={mk("3", "Empowered Woman Coaching", "EWC Cohort 1", "completed")} isCompleted />
    </div>
  );
}
