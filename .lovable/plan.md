# Calendly booking for 1-on-1 meetings

## Goal
Anyone who buys a program that comes with a 1-on-1 meeting can book it with Calendly right after paying, from their email, and later from the app. You turn this on for each program in Admin.

## 1. Admin: mark a program as "Includes 1-on-1 meeting"
In Admin, Programs, Program Catalog, edit program, add a new section:
- Checkbox: **Includes 1-on-1 meeting**. Use it for any program, for example a course that comes with a bonus private call. This is separate from the existing "1:1 Service" option, which keeps working as it does now.
- **Number of meetings included** (default 1)
- **Calendly booking link**: paste the event link (https://calendly.com/...)
- Optional **booking note** in Farsi, for example "۳۰ دقیقه با علی لطفی"
- The existing "1:1 Service" programs also get the Calendly link field, so they can use the same flow.
- In the program list, programs with this option show a small "1:1" tag.

## 2. After payment (payment success page)
If the program includes a 1-on-1 meeting, the page shows a "Book your 1-on-1 meeting" card above "Open Rilo". Tapping it opens Calendly with the buyer's name and email already filled in.

## 3. Confirmation email
The enrollment email gets a "رزرو وقت جلسه / Book your session" button with the same pre-filled link. Following the merge rule, it goes to all of the user's linked emails.

## 4. In the app (round page Quick Actions and My Programs)
For enrolled students, the round page's Quick Actions shows a "Book 1-on-1 meeting" button with a calendar icon. It opens Calendly in the browser with name and email pre-filled. Students can come back later to book or reschedule.

## 5. Later (not in this step)
Automatically record the booked time in the app, so it shows as the next session and counts toward meetings used. This needs the Calendly connection and a webhook. It is a separate step, after the basic flow is working.

## Technical details
- Migration on `program_catalog`: `includes_one_on_one boolean default false`, `one_on_one_count int default 1`, `booking_url text`, `booking_note text`.
- ProgramsManager: new fields saved with the program, plus validation that `booking_url` starts with `https://calendly.com/`.
- Shared helper `buildBookingUrl(url, name, email)` that adds `?name=&email=` (URL-encoded).
- PaymentSuccess: load the program by slug and show the card when `includes_one_on_one || is_one_on_one` and `booking_url` is set.
- send-enrollment-email: optional booking button block when the program has a booking link.
- Round Quick Actions: add the button when the round's program has a booking link.
- No Calendly API connection is needed for steps 1–4.
