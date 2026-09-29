# Show playlist details in My Learning

## What will change
- Load the attached audio or video playlist’s title for the learner’s active round.
- Replace the bare “Continue listening” button with the same structured learning panel used for courses: a small “Start here” or “Continue” label, the playlist title, and a clear listening/watching button.
- Keep the existing destination and behavior when the learner taps the button.

## Technical details
- Extend the existing My Learning data hook to return attached playlist names alongside their IDs and type.
- Render the first attached playlist in the course-style panel when a round has no course.
- Preserve the current course display unchanged and keep the compact mobile layout.

## Verification
- Check the Path page at mobile width and confirm the playlist title is visible, truncated safely, and the button opens the correct playlist.
