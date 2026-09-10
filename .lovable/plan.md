# Simplify app navigation layout

## Changes
- Remove the separate desktop shell wrapper that is constraining app pages and breaking scrolling.
- Keep the existing app content container unchanged on every screen size.
- Reuse the same four mobile navigation destinations as a fixed left-side navigation on desktop.
- Add the Rilo logo and app-download QR code beneath the desktop navigation.
- Preserve the current bottom navigation on mobile and existing full-screen page exceptions.

## Validation
- Check scrolling on Path and Tools at desktop and mobile sizes.
- Confirm navigation links and the QR code display correctly.
- Run the project’s existing checks.
