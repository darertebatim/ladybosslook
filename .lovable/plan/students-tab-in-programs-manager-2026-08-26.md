# Students tab in Programs Manager

Add a new "Students" tab to Admin → Programs that lets you pick a program, then a round, and see a rich roster of the enrolled people.

## Flow

1. Select a program (from the active program catalog).
2. Select a round (or "All rounds" / "No round assigned").
3. A table lists every active enrollment with a per-student profile snapshot.
4. Click a row to open a detail panel with everything we know about that student.
5. Search box (name / email / phone) and CSV export of the visible list.

## What each row shows

- Name, primary email, phone
- Merged/extra emails badge (e.g. "+2 emails") from the account alias records — hover/expand to see them
- App activity: "Never opened" vs last active date, total active days, and install platform (iOS / Android / Web) when we have one
- Location: city, state, country (+ timezone)
- Business / occupation: occupation, Instagram handle, short bio snippet
- Rilo Plus status (active / trial / none)
- Enrolled date and current round
- Payment: order status for this program (paid / free / refunded / partially refunded) when an order exists

Rows where the student has never opened the app get a subtle warning highlight, so onboarding follow-ups are easy to spot.

## Detail panel

Full profile: all emails, phone, birthday, language, goals, referral source, timezone, account created date, full enrollment history across programs, and their orders for this program.

## Technical notes

- New component `src/components/admin/ProgramStudentsManager.tsx`, mounted as a 6th tab in `src/pages/admin/Programs.tsx`.
- Data is assembled client-side with the existing Supabase client (same pattern as `ProgramEnrollmentManager.tsx`): read `course_enrollments` for the program/round, then batched `.in('user_id', ids)` reads against `profiles`, `account_email_aliases`, `app_installations`, `user_subscriptions`, and `orders`.
- "Never opened the app" = no `app_installations` row and no `last_active_date` on the profile.
- No database changes needed; all tables and admin read policies already exist.
- Existing tabs and `ProgramEnrollmentManager` are left untouched.
