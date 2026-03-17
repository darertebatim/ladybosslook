

## Share Routine — Updated Plan

**Single file edit:** `src/pages/app/AppInspireDetail.tsx`

### Share Button
- Add a `Share2` icon button in the top-right header, matching `BackButtonCircle` style (white circle, `bg-black/30 backdrop-blur-sm`)

### On Tap — Native Share Flow
1. Fetch cover image as blob → convert to `File`
2. Call `navigator.share()` with:
   - **files**: `[coverImageFile]`
   - **title**: routine title
   - **text**: `"Hey! Join me in the '{title}' routine on Routine Ladyboss 💫\nDownload the app: https://apps.apple.com/app/id6755076134"`
   - **url**: `https://apps.apple.com/app/id6755076134`
3. **Fallback 1** (no file support): share text + url only
4. **Fallback 2** (no share API): copy text + link to clipboard, show toast

### Share Message
```
Hey! Join me in the '{Routine Title}' routine on Routine Ladyboss 💫
Download the app: https://apps.apple.com/app/id6755076134
```

No new files needed — just the button + async handler in the existing detail page.

