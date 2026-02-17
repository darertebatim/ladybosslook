

# AI Assistant -- Current State Review and Improvement Plan

## What It Can Do Today

**Direct Database Actions (Tools page only):**
- Create and update actions, rituals, and breathing exercises
- Add and delete subtasks on actions
- Context-aware: fetches existing items with IDs, categories, colors, subtasks

**Other Pages (form-fill only, no direct execution):**
- Generate broadcast content, feed posts, push notifications
- Suggest routine plans and task templates

**UI and UX:**
- Slide-in panel from the right with backdrop overlay
- Persistent chat history via localStorage
- Streaming responses with markdown rendering
- Action result cards (success/error) for database operations
- Quick action buttons contextual to the current page

---

## Recommended Improvements

### 1. Delete Actions, Rituals, and Breathing Exercises
Currently the AI can create and update items but cannot delete them. Adding `delete_action_from_bank`, `delete_ritual_from_bank`, and `delete_breathing_exercise` tools would complete the CRUD set.

### 2. Manage Ritual Tasks (Add/Remove/Reorder)
The AI can create a ritual with tasks, but cannot later add new tasks to an existing ritual, remove tasks, or reorder them. Adding `add_tasks_to_ritual` and `delete_ritual_task` tools would fix this gap.

### 3. Bulk Operations
When asked to "create 10 actions," the AI calls `create_action_in_bank` 10 times sequentially. A `bulk_create_actions` tool that does a single batch insert would be faster and more reliable.

### 4. Search and Filter Context
The context currently loads only 20 actions and 10 rituals. If the database grows, the AI won't "see" older items. Adding a `search_items` tool that lets the AI query by title/category on demand would make it scale.

### 5. Undo / Rollback Last Action
After a create or update, offer an "Undo" button in the action result card that reverts the last change. This would store the previous state before update and allow a one-click rollback.

### 6. Direct Execution on More Pages
Currently only the Tools page has direct-execution tools. The Communications and Community pages still use form-fill tools that require a matching form handler on the page. Converting `create_broadcast_content` and `create_feed_post_content` to direct-execution (inserting into `feed_posts` / sending broadcasts directly) would make the AI equally powerful across all pages.

### 7. Image/Cover Upload Support
Rituals and programs support cover images, but the AI cannot upload or assign images. Adding a tool that accepts an image URL or generates a placeholder and uploads it to the `routine-covers` storage bucket would round out the content creation flow.

### 8. Confirmation Before Destructive Actions
For deletes and bulk updates, show a confirmation step in the chat ("Are you sure you want to delete 5 actions?") before executing. This prevents accidental data loss.

### 9. Keyboard Shortcut to Open/Close
Add a keyboard shortcut (e.g., Cmd+K or Cmd+J) to toggle the AI panel open/closed for faster access.

### 10. Conversation Export
Allow exporting the chat history as a text/markdown file for record-keeping or sharing with team members.

---

## Technical Details

### New Edge Function Tools (Priority Items)

**Delete tools** -- add to `directExecutionTools` array and `executeToolAction` switch:
- `delete_action_from_bank` -- requires `id`, calls `.delete().eq("id", id)` on `admin_task_bank` (also deletes subtasks first)
- `delete_ritual_from_bank` -- requires `id`, cascades to `routines_bank_tasks` and `routines_bank_sections`
- `delete_breathing_exercise` -- requires `id`

**Ritual task management tools:**
- `add_tasks_to_ritual` -- requires `ritual_id` and `tasks[]`, inserts into `routines_bank_tasks`
- `delete_ritual_task` -- requires `id`, deletes from `routines_bank_tasks`

**System prompt updates:**
- Add rules 13-15 for delete operations and confirmation language
- Expand context fetch to include `routines_bank_tasks` for existing rituals

### Frontend Changes

**Keyboard shortcut** -- in `AIAssistantContext.tsx`:
```text
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Undo button** -- store previous state in action results, render an "Undo" button in the result card that calls the update tool with the old values.

---

## Suggested Priority Order

| Priority | Improvement | Effort |
|----------|------------|--------|
| 1 | Delete tools (actions, rituals, exercises) | Low |
| 2 | Ritual task management (add/remove tasks) | Low |
| 3 | Keyboard shortcut (Cmd+J) | Low |
| 4 | Direct execution on Communications page | Medium |
| 5 | Confirmation before destructive actions | Low |
| 6 | Bulk operations | Medium |
| 7 | Search/filter tool for large datasets | Medium |
| 8 | Undo/rollback | Medium |
| 9 | Conversation export | Low |
| 10 | Image/cover upload | High |

