# Project Rules

## No Hover Effects
This is a mobile-first app built for iOS/Android via Capacitor. **Never use `hover:` Tailwind classes or `:hover` CSS pseudo-classes anywhere in the project.** Mobile devices do not support hover interactions. Use `active:scale-95` or `active:opacity-80` for tactile touch feedback instead.
