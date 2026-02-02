# LadyBoss App - Complete Reference Document

---

## 1. TASK SYSTEM

### 1.1 Task Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Task name |
| `description` | string | Optional task description |
| `emoji` | string | Task icon (e.g., ☀️) |
| `color` | TaskColor | Visual color theme |
| `scheduled_date` | date | When task is scheduled |
| `scheduled_time` | time | Optional specific time |
| `repeat_pattern` | RepeatPattern | How task repeats |
| `repeat_days` | number[] | Custom days (0=Sun, 6=Sat) |
| `reminder_enabled` | boolean | Whether reminder is on |
| `reminder_offset` | number | Minutes before to remind |
| `is_urgent` | boolean | Mark as urgent |
| `tag` | string | Category label |
| `order_index` | number | Sort order in list |
| `is_active` | boolean | Whether task is active |
| `linked_playlist_id` | uuid | Link to audio playlist |
| `pro_link_type` | ProLinkType | Type of app integration |
| `pro_link_value` | string | Value for integration |
| `goal_enabled` | boolean | Enable goal tracking |
| `goal_type` | 'timer' \| 'count' | Timer or counter goal |
| `goal_target` | number | Target value |
| `goal_unit` | string | Unit label (e.g., "cups") |

### 1.2 Task Colors

| Color Name | Hex Code | CSS Class |
|------------|----------|-----------|
| pink | #FFD6E8 | bg-[#FFD6E8] |
| peach | #FFE4C4 | bg-[#FFE4C4] |
| yellow | #FFF59D | bg-[#FFF59D] |
| lime | #E8F5A3 | bg-[#E8F5A3] |
| sky | #C5E8FA | bg-[#C5E8FA] |
| mint | #B8F5E4 | bg-[#B8F5E4] |
| lavender | #E8D4F8 | bg-[#E8D4F8] |

### 1.3 Repeat Patterns

| Pattern | Description |
|---------|-------------|
| `none` | One-time task (only on scheduled date) |
| `daily` | Repeats every day |
| `weekly` | Same day of week as original |
| `monthly` | Same date each month |
| `weekend` | Saturday & Sunday only |
| `custom` | Specific days via repeat_days array |

---

## 2. TASK SETTINGS & CONFIGURATION

### 2.1 Pro Task Link Types

Tasks can link to app features. When tapped, they open the linked feature.

| Type | Label | Badge | Route | Requires Value |
|------|-------|-------|-------|----------------|
| `playlist` | Audio Playlist | Listen | /app/player/playlist/{id} | Yes |
| `journal` | Journal Writing | Write | /app/journal/new | No |
| `breathe` | Breathing Exercise | Breathe | /app/breathe?exercise={id} | Yes |
| `water` | Water Tracking | Drink | /app/water | No |
| `period` | Period Tracker | Log | /app/period | No |
| `channel` | Community Channel | Check | /app/channels?channel={id} | Yes |
| `program` | Program Page | Learn | /app/course/{slug} | Yes |
| `planner` | Planner | Plan | /app/home | No |
| `inspire` | Inspire/Routines | Explore | /app/routines/{id} | No |
| `route` | Custom Route | Open | {custom path} | Yes |

### 2.2 Goal Types

| Type | Description | Example |
|------|-------------|---------|
| `timer` | Duration-based goal | "Meditate for 10 minutes" |
| `count` | Quantity-based goal | "Drink 8 cups of water" |

### 2.3 Reminder Settings

- **reminder_enabled**: Toggle notifications
- **reminder_offset**: Minutes before scheduled_time to notify (default: 5)
- **is_urgent**: Uses alarm-style notification that bypasses silent mode

---

## 3. APP FEATURES & TOOLS

### 3.1 Wellness Tools (Active)

| ID | Name | Icon | Route | Description |
|----|------|------|-------|-------------|
| journal | Journal | BookOpen | /app/journal | Daily reflections |
| breathe | Breathe | Wind | /app/breathe | Breathing exercises |
| water | Water | Droplets | /app/water | Hydration tracker |
| routines | Routines | Sparkles | /app/routines | Daily habits |
| programs | My Programs | GraduationCap | /app/programs | Courses & coaching |
| profile | My Profile | User | /app/profile | Settings & account |

### 3.2 Audio/Media Tools (Active)

| ID | Name | Icon | Route | Description |
|----|------|------|-------|-------------|
| meditate | Meditate | Brain | /app/player?category=meditate | Guided meditation |
| workout | Videos | Dumbbell | /app/player?category=workout | Workout videos |
| soundscape | Sounds | Waves | /app/player?category=soundscape | Ambient sounds |

### 3.3 Additional Features (Active)

| ID | Name | Icon | Route | Description |
|----|------|------|-------|-------------|
| period | Period | Heart | /app/period | Cycle tracking |

### 3.4 Coming Soon Features

| ID | Name | Icon | Route | Description |
|----|------|------|-------|-------------|
| ai | AI Coach | Bot | /app/ai | Personal assistant |
| challenges | Challenges | Trophy | /app/challenges | Goal challenges |
| mood | Mood | Smile | /app/mood | Track emotions |

### 3.5 Hidden/Future Features

| ID | Name | Description |
|----|------|-------------|
| fasting | Fasting | Intermittent fasting |
| emotions | Emotions | Name your feelings |
| reflections | Reflections | Guided prompts |
| tests | Tests | Self-assessments |
| habits | Habits | Habit building |

---

## 4. TASK TEMPLATE CATEGORIES

Templates in the Task Bank are organized by category:

| Category | Description |
|----------|-------------|
| morning | Morning routine tasks |
| evening | Evening/wind-down tasks |
| selfcare | Self-care activities |
| business | Work/productivity tasks |
| wellness | Health & wellness tasks |
| general | Uncategorized tasks |

---

## 5. DATABASE TABLES

### 5.1 User Tasks (`user_tasks`)
- Main table storing user's personal tasks
- RLS: Users can only access their own tasks

### 5.2 User Subtasks (`user_subtasks`)
- Checklist items within a task
- Linked to parent task via `task_id`

### 5.3 Task Completions (`task_completions`)
- Records when tasks are completed
- Tracks `completed_date` and `goal_progress`

### 5.4 Subtask Completions (`subtask_completions`)
- Records when subtasks are checked off

### 5.5 User Streaks (`user_streaks`)
- Tracks current and longest completion streaks

### 5.6 User Tags (`user_tags`)
- Custom category labels created by users

### 5.7 Admin Task Bank (`admin_task_bank`)
- Template library managed by admins
- Tasks are copied (not synced) to user_tasks

---

## 6. FEATURE INTEGRATION SUMMARY

| Feature | Can Link to Tasks | Has "Add to Routine" Button | Route |
|---------|-------------------|----------------------------|-------|
| Audio Playlists | ✅ Yes | ✅ Yes | /app/player/playlist/{id} |
| Journal | ✅ Yes | ✅ Yes | /app/journal |
| Breathing | ✅ Yes | ✅ Yes | /app/breathe |
| Water Tracking | ✅ Yes | ✅ Yes | /app/water |
| Period Tracker | ✅ Yes | ❌ No | /app/period |
| Community Channels | ✅ Yes | ❌ No | /app/channels |
| Programs/Courses | ✅ Yes | ❌ No | /app/course/{slug} |
| Routines Bank | N/A | ✅ Yes | /app/routines |

---

## 7. UI DESIGN SPECS

### 7.1 Task Card Design
- Title: 15px unbolded black
- Description: Single-line truncated
- Completed tasks: Strikethrough (no opacity reduction)
- Colors: Me+ style bright pastels

### 7.2 Color Palette
```
Primary Pink:   #FFD6E8
Peach:          #FFE4C4
Yellow:         #FFF59D
Lime:           #E8F5A3
Sky:            #C5E8FA
Mint:           #B8F5E4
Lavender:       #E8D4F8
```

---

*Document generated: February 2026*
*Version: 1.1.08*
