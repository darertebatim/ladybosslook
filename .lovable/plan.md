

## Weekly Review Flow — Updated Plan

Same as the previously approved plan, with one key change to **Step 5 (Task Suggestions)**:

### Change: Personalized Task Suggestions in Step 5

Instead of showing random/static task suggestions, the `week-task-suggestions` renderer will read the user's answers from steps 3 and 4 (passed via the `answers` prop already available in `OnboardingStepRenderer`) and map them to relevant tasks.

**How it works:**

1. Define a mapping object that links each selection from steps 3-4 to specific task suggestions:

```text
Step 3 answer ("felt good about")     →  Reinforcement tasks
─────────────────────────────────────────────────────────
Sleep                                  →  "Wind-down routine at 10pm"
Physical activities                    →  "30-min workout"
Mindfulness                            →  "5-min morning meditation"

Step 4 answer ("focus on next week")   →  Growth tasks
─────────────────────────────────────────────────────────
Sleep better                           →  "No screens after 9pm"
Eat healthier                          →  "Meal prep Sunday"
Be more active                         →  "Walk 10,000 steps"
Stay Calm                              →  "Breathing exercise 2x daily"
Be organized                           →  "Plan tomorrow before bed"
```

2. The renderer collects answers from `answers['wr-felt-good']` and `answers['wr-focus-next']`, looks up matching tasks from the mapping, and displays the top 3-4 most relevant ones.

3. If no answers exist (user skipped), fall back to a default set of popular tasks.

4. Each suggested task card shows an emoji, title, and is pre-checked. On "Next," checked tasks get inserted into `user_tasks`.

### Everything else remains the same

All other steps (1-4, 6), the banner, admin registration, and technical approach are unchanged from the approved plan.

