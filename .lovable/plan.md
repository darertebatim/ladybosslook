

## Plan: Create 5 Reading Content Items from Financial Literacy Book

### What we're building
5 separate reading content entries (type: `lesson`, category: `financial-literacy`) -- one per chapter of the Farsi book, translated to English with structured sections.

### Process (scripted, not manual)

**Step 1: Extract and translate each chapter**
- Use the AI gateway script to translate each chapter from Farsi to English
- The full text is ~297K characters across 5 chapters, so each chapter will be processed separately
- AI will translate and also structure each chapter into 6-12 sections with headings, body text, and pull quotes

**Step 2: Insert into database**
- For each of the 5 chapters, insert one `reading_content` row:
  - type: `lesson`
  - category: `financial-literacy`
  - theme colors: varied pastels (one per chapter)
  - emojis: contextual (e.g. 💰, 📊, 💡, 🔄, 🌱)
  - cover_aspect: `square` (title + emoji visible)
  - is_published: true
- For each content item, insert 6-12 `reading_sections` rows with translated/structured content

**Step 3: Verify**
- Query the database to confirm all 5 items and their sections were inserted correctly

### Content titles (tentative English translations)
1. "Your First Step to Financial Independence"
2. "The Ladder of Financial Empowerment"
3. "The 6-Day, 6-Million Challenge"
4. "The Replacement Strategy & Financial Multiplication"
5. "Self-Care and Money-Making: 6 Practical Examples"

### Technical details
- Uses the `lovable_ai.py` script with `--schema` for structured JSON output
- Each chapter extracted via SQL substring between chapter markers
- All inserts done via the Supabase insert tool (data operations, not schema changes)
- No schema migrations needed -- uses existing `reading_content` and `reading_sections` tables

