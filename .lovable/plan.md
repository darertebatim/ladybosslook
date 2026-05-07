# Add 10 Curated Self-Care Routines to Routines Bank

Insert your 10 Claude-curated routines into `routines_bank` and `routines_bank_tasks`, linking every task to an existing `admin_task_bank` row from the self-care categories. No new tasks generated — every entry is matched to an existing bank task.

## Approach

1. Create one admin migration that inserts:
   - 10 rows into `routines_bank` (one per routine)
   - 60 rows into `routines_bank_tasks` (sum of all tasks across the 10 routines), each with `task_id` pointing to the existing `admin_task_bank` row, plus `title`, `emoji`, and `task_order` carried over so the routine renders correctly even if the bank task is later edited.
2. Use `schedule_type = 'challenge'`, `end_mode = 'after_days'`, `end_after_days = <duration>` so durations (5/21/7/14/3 days) are honored by the existing routine engine.
3. Mark all 10 as `is_active = true`, `is_popular = true`, with sensible `color` + `emoji` per routine.

## Task → admin_task_bank ID Mapping (verified from DB)

All 44 unique task titles in your file exist in the bank. Where a title appears in multiple categories, I picked the row whose category best matches the column you wrote in the markdown:

| Task title | Chosen category | Bank ID |
|---|---|---|
| Take 3 Deep breaths | calm | f487889c |
| Do a quick body scan for tension or relaxation | calm | de0560b8 |
| Do a mindful breathing exercise | calm | c9e42794 |
| Take a short walk without distraction | calm | e528f113 |
| Visualize a peaceful place | calm | e16e75b8 |
| Make myself a cup of chamomile tea after dinner | calm | 855e18df |
| Write down all my thoughts and worries | calm | b243d32f |
| Eat my meal without my phone or TV | calm | b62f5c6f |
| Turn off notifications for 1 hour | productivity | 09853feb |
| Drink a glass of water with every meal | nutrition | fc7b534d |
| Keep a water bottle around throughout the day | nutrition | c2e67b75 |
| Fill my water bottle | nutrition | 20aa2fba |
| Give myself permission to rest | selfkind | fbaac9d3 |
| Say one kind thing to myself as if I were a friend | selfkind | 7e298831 |
| Allow myself to feel my emotions without judgment | selfkind | c1e0374c |
| Smile at myself in the mirror | selfkind | 0c7be162 |
| Tell myself "I just need to do my best" when overwhelmed | selfkind | fb8a7d24 |
| Say one thing I'm grateful for before bed | sleep | aab476e5 |
| Wind down with a sleep breathing exercise before bed | sleep | 858f3eeb |
| Get 10 min of sunlight in the morning | sleep | 8bce1022 |
| Go to bed at the same time every night | sleep | fa6751f1 |
| Wash face | easy-win | 6e4cb26c |
| Step outside once | easy-win | 4e15d72f |
| Go for a 5-minute walk | movement | 1c7fe435 |
| Plan top 3 priorities | productivity | 6cf2dfee |
| Break a task into smaller steps | productivity | 312a7f0e |
| Try a focus timer for deep work | productivity | c3ddd142 |
| Name one thing I accomplished at the end of the day | productivity | dc597c9a |
| Write down my goals in the morning | productivity | bb9c574b |
| Write down the first step of my task | productivity | 5d8580dd |
| Start with the most important task | productivity | f5680c4b |
| Check off one item from my to-do list | productivity | bbf362cd |
| Write down my goals for tomorrow | productivity | 569ba3ab |
| Spend 5 minutes tidying my home | productivity | fde60c67 |
| Spend time with family | LovedOnes | b5282e69 |
| Put my phone away when spending time with a loved one | connection | 449e9d40 |
| Name one person who cares for me | connection | 77bb3a28 |
| Send a kind message | connection | ece780d2 |
| Check in on someone I care about | connection | 72d93d32 |
| Express gratitude to a loved one | connection | 33998f05 |
| Hug a loved one before bed | connection | 6b49c114 |
| Thank myself for making it through the day | gratitude | c5a020ce |
| Dim lights before bed | Evening | a60dec44 |
| Write down 2 things that weigh me down before sleeping | Evening | 85d1b3aa |

## The 10 Routines (as inserted)

| # | Title | Emoji | Color | Days | Tasks |
|---|---|---|---|---|---|
| 1 | Period Care Routine | 🌸 | pink | 5 | 6 |
| 2 | New Mom Self-Care Routine | 🤱 | peach | 21 | 5 |
| 3 | After a Breakup Routine | 💗 | lavender | 7 | 7 |
| 4 | ADHD Routine | 🧠 | sky | 14 | 6 |
| 5 | Anxiety Relief Routine | 🌬️ | mint | 3 | 6 |
| 6 | Anti-Procrastination Routine | 🎯 | yellow | 14 | 5 |
| 7 | Working Parent Routine | 👨‍👩‍👧 | peach | 21 | 7 |
| 8 | After a Hard Day Routine | 🌙 | purple | 3 | 6 |
| 9 | Loneliness Routine | 💕 | pink | 7 | 5 |
| 10 | Career Stress Routine | 💼 | sky | 14 | 7 |

Each routine gets `category = 'selfcare'`, `is_active = true`, `is_popular = true`, `is_free = true`, `schedule_type = 'challenge'`, `end_mode = 'after_days'`, `end_after_days = <duration>`, and a tagline stored in `subtitle`.

## What I will NOT do

- Not generate any new tasks. Every `routines_bank_tasks.task_id` references an existing `admin_task_bank` row.
- Not touch covers/badge images (left null — you can add them later in admin).
- Not change any existing routines.

## Files / DB changes

- One Supabase migration: `INSERT INTO routines_bank ...` (10 rows) + `INSERT INTO routines_bank_tasks ...` (60 rows, with `task_order` 1..N per routine).

After approval, I'll run the migration and confirm row counts.
