# Quant Prep — Definition of Product (MVP)

## 1. Product Overview

### Product vision

Quant Prep is a modular web application for quant interview preparation. The platform is designed to eventually contain multiple training modules, but the first and only active module in v1 is **Mental Math**.

### Core outcome

Help users improve speed and accuracy on quant-style arithmetic under pressure through structured practice sessions, realistic test simulations, and progress tracking.

### MVP scope

This document defines the MVP in enough detail to build the product.

The MVP includes:

* authentication and user accounts
* landing page with module widgets
* Mental Math module
* Practice Mode and Test Mode
* procedural question generation
* session tracking and autosave
* results and mistakes review
* Statistics page
* mobile-friendly and accessible UI

The MVP does **not** include:

* leaderboards
* social features
* anti-cheat systems
* detailed onboarding flows
* AI explanations per question
* adaptive difficulty recommendations
* additional quant modules beyond Mental Math

---

## 2. High-Level App Structure

### Main pages

1. **Landing Page / Dashboard**

   * Shows widget-style cards for modules
   * For v1, only **Mental Math** is active
   * Other widgets can exist visually as placeholders for future modules

2. **Mental Math Module**

   * Session mode selection
   * Configuration / preset selection
   * Active session experience
   * Results page
   * Mistakes / review flow

3. **Statistics Page**

   * Shows saved performance data and graphs
   * Focuses on simple but useful trend tracking

### Navigation

Top-level navigation should at minimum include:

* Dashboard
* Mental Math
* Statistics
* Profile / Account

---

## 3. Landing Page / Dashboard Definition

### Purpose

The landing page is the user’s starting point after login. It should feel like a modular training hub.

### Required behavior

* Show a grid of widgets/cards representing training modules
* For v1, only **Mental Math** is clickable and active
* Other modules can be shown as inactive / coming soon placeholders
* Dashboard should also surface quick progress context so the app feels alive immediately

### Dashboard sections

#### A. Primary action area

* **Continue / Start Session** CTA
* Current streak
* Recent performance snapshot

#### B. Module widget area

* Mental Math widget/card (active)
* Future placeholder widgets (inactive)

Examples of future widgets:

* Probability
* Brainteasers
* Sequences
* Market Making

#### C. Lightweight progress context

Keep this minimal for v1.

### Recommended dashboard cards / widgets for v1

1. **Mental Math** widget

   * Title
   * Short description
   * Start / continue button

2. **Current Streak** widget

   * Shows current daily streak

3. **Recent Snapshot** widget

   * Last 7-day accuracy
   * Last 7-day average response time
   * Percent within target in recent sessions

### Empty state behavior

If user has no sessions yet:

* show a friendly empty state
* include CTA: **Start your first Mental Math session**
* graph areas should show placeholder frames and minimal helper text

---

## 4. Mental Math Module Definition

### Core idea

Users complete structured arithmetic sessions and track performance over time.

### Session modes

Mental Math has two main modes:

1. **Practice Mode**
2. **Test Mode**

Both modes use the same base experience:

* one question at a time
* free input only
* auto-advance after valid submission
* skip allowed
* per-question timing tracked
* total session tracked
* results saved

---

## 5. Practice Mode Definition

### Purpose

Flexible training mode for repetition, warmups, focused drills, or open-ended practice.

### Practice Mode supports

* single level selection
* multiple level selection (mixed practice)
* selected operations
* selected number types
* finite sessions
* open-ended sessions
* optional total timer
* pause allowed

### Practice Mode scoring

* correct = +1
* wrong = 0
* skipped = 0

### Practice Mode timer behavior

* total timer is optional
* if timer is enabled, it is shown subtly in the UI
* timer may be paused in Practice Mode
* when paused, input is disabled
* when timer expires, session ends immediately
* current unanswered question becomes skipped

### Practice Mode ending conditions

Practice Mode can end in two ways:

#### Finite practice

* User chooses a fixed question count
* Session ends after all questions are answered/skipped or when timer expires

#### Open-ended practice

* User manually ends the session
* Session is saved with whatever has been completed so far
* Only questions actually shown count toward results
* Unseen future questions do not count as skipped
* If timer expires while a question is active, that current question becomes skipped and the session ends immediately

### Practice Mode pause behavior

* allowed only in Practice Mode
* pausing freezes the timer
* answer input is disabled while paused
* no answering or skipping while paused

---

## 6. Test Mode Definition

### Purpose

Simulate realistic quant-style test pressure with mandatory timing and scoring penalties.

### Test Mode behavior

* timer is mandatory
* no pause
* no backtracking
* skip allowed
* preset-driven setup
* current unanswered question becomes skipped if timer expires
* session ends immediately on timer expiry

### Test Mode scoring

* correct = +1
* wrong = -1
* skipped = 0
* negative score is allowed and may be displayed as-is

### Test Mode preset philosophy

Presets should be fast to start and realistic enough to simulate pressure.

### Recommended v1 Test Mode presets

1. **Optiver 80 in 8**

   * 80 questions
   * 8 minutes
   * mixed difficulty / realistic test-style mix
   * scoring: +1 correct, -1 wrong, 0 skipped

2. **Mixed Sprint 20**

   * 20 questions
   * shorter timed mixed test
   * scoring: +1 correct, -1 wrong, 0 skipped

3. **Mixed Sprint 40**

   * 40 questions
   * medium-length timed mixed test
   * scoring: +1 correct, -1 wrong, 0 skipped

4. **Fractions & Decimals Drill**

   * timed test-style preset focusing more on higher cognitive-load arithmetic
   * scoring: +1 correct, -1 wrong, 0 skipped

### Scoring explanation text

Scoring should be visible in small subtle text:

* on preset selection
* again on results page

Example text:

* Practice: `Scoring: +1 correct, 0 wrong/skipped`
* Test: `Scoring: +1 correct, -1 wrong, 0 skipped`

---

## 7. Session Configuration Definition

### Practice Mode configuration fields

* selected level(s) — multi-select
* operation filters — add / sub / mul / div
* number type filters — integer / decimal / fraction / mixed
* finite or open-ended
* question count (for finite mode)
* timed on/off
* total timer length (if timed)
* pause allowed (yes; practice only)

### Test Mode configuration fields

* preset selection only for v1
* later custom tests can be added, but not in MVP

### Session mode UX recommendation

* Keep preset choices obvious and fast
* Keep custom practice configuration accessible but not cluttered
* User should be able to start a session quickly

---

## 8. Session Lifecycle

### Session creation

When a user starts a session:

* generate full session question set up front for finite sessions
* or initialize open-ended generation logic for open-ended mode
* assign session seed
* assign generator version
* save session state immediately

### During session

For every question:

* show one prompt at a time
* track start time for the current question
* user enters answer or skips
* valid submit auto-advances
* invalid submit does not continue
* response time is stored
* session progress is autosaved

### Timer behavior

Two timer concepts exist:

1. **Total session timer**
2. **Per-question timer tracking** (for analytics)

### Timer UI

* shown subtly
* positioned small in the interface
* should not distract from the arithmetic task

### On refresh / accidental leave

* session state is autosaved
* user can resume
* for timed sessions, timer must be based on persisted timestamps, not local client pause behavior
* leaving the page should not pause Test Mode

### Session completion

A session completes when:

* all finite questions are answered/skipped
* timer expires
* or user manually ends open-ended Practice Mode

---

## 9. Answer Input and Submission Rules

### Input model

* free input only
* no multiple choice in v1

### Submission rules

* pressing **Enter** submits
* clicking **Submit** does the same as Enter
* valid submission auto-advances to the next question
* invalid input prevents advancement

### Before submission

* user can edit freely before submitting
* no live correctness reveal while typing

### During session

* no correctness reveal after submit
* no correct answer shown during active session
* skipped questions immediately advance without reveal

### Invalid input behavior

* do not advance
* show minimal inline input feedback if needed
* avoid intrusive modals

---

## 10. Answer Normalization Rules

These rules should be supported so answer checking feels fair.

### General

* trim whitespace
* normalize reasonable numeric formatting

### Integers

* exact integer match

### Decimals

* accept `.5` and `0.5`
* ignore insignificant trailing zeros
* compare in normalized form

### Fractions

* input format: `a/b`
* equivalent fractions should be accepted
* fraction should be normalized internally

### Negative answers

* negative values are allowed where valid

### Mixed numbers

* can be avoided in v1 unless parser support is added explicitly

---

## 11. Skip Behavior

### Rules

* user may skip a question in both Practice and Test modes
* skipping immediately advances to the next question
* skipped questions are not revealed during the session
* skipped questions appear in results/review afterward

### Scoring

* Practice: skipped = 0
* Test: skipped = 0

---

## 12. Results Screen Definition

### Results screen should show

* score
* accuracy
* total time
* average response time
* number correct
* number wrong
* number skipped
* target pace comparison
* session metadata

### Session metadata block

* mode
* preset name or custom config label
* selected level(s)
* timed / untimed
* question count (if finite)

### Target pace comparison

Show:

* percent solved within target time
* average deviation from target time

### Performance breakdowns on results page

At minimum:

* by operation
* by number type

Possible later:

* by variable position
* by level in mixed sessions

### Mistakes preview on results page

* show wrong and skipped questions in preview form
* link to dedicated Mistakes page / full review

---

## 13. Mistakes / Review Definition

### Purpose

Give users a dedicated area to revisit incorrect and skipped questions.

### Mistakes page structure

Use tabs or filters:

* All
* Incorrect
* Skipped

### Filters

* level
* operation
* number type
* date range
* mode (practice/test)

### Each mistake item should show

* question prompt
* user answer
* correct answer
* response time
* tags / metadata
* source session and date

### Actions

For v1:

* retry this question (optional simple implementation)
* navigate back to original session review

Not required in v1:

* mark as reviewed
* explanation engine
* spaced repetition

---

## 14. Statistics Page Definition

### Purpose

A dedicated page for saved performance analytics.

### Dashboard strategy for v1

Keep this simple. Use **3 main graphs only**.

### The 3 chosen graphs for v1

1. **Accuracy Over Time**

   * Shows how user accuracy changes across sessions / dates

2. **Average Response Time Over Time**

   * Shows trend in speed improvement

3. **Performance Breakdown Bar Chart**

   * A single breakdown view that can toggle between:

     * by level
     * by operation
     * by number type

This gives a strong balance between simplicity and usefulness.

### Supporting stats cards on Statistics page

Recommended top summary cards:

* sessions completed
* questions answered
* current streak
* percent within target time

### Empty states

If no sessions exist:

* show empty graph shells
* helper text: `Complete a session to start tracking progress`
* CTA: `Start your first session`

If not enough data exists:

* still show minimal graph state if possible
* add text like: `Complete more sessions to see trends`

---

## 15. Recent Snapshot Definition

The landing page should show a minimal recent performance snapshot.

### Recommended recent snapshot contents

* last 7-day accuracy
* last 7-day average response time
* percent within target in recent sessions

This should be lightweight and not replace the Statistics page.

---

## 16. Daily Streak Definition

### Rule

A streak increments if the user completes at least one qualifying session in their local day.

### Qualifying session

Recommended rule:

* session must contain at least 5 completed/shown questions to count toward streak

### Additional rules

* multiple sessions in one day still count as only one streak day
* missing a full day breaks the streak
* use user local timezone
* both Practice and Test sessions count

---

## 17. Procedural Generation Architecture

### Generation approach

Use **TypeScript on the server side**.

### Why

* aligns with Next.js / Vercel stack
* avoids extra service complexity
* performance is more than sufficient

### Randomness philosophy

Do **not** use fully unconstrained random generation.
Use **weighted random generation with balancing**.

### Goals of generation

* feel random
* stay within difficulty constraints
* avoid broken or ugly question sets
* maintain session-level balance
* remain similar in style to the researched question types

### Balancing rules

Within a session, generation should aim to balance:

* operation type distribution
* variable position distribution
* number type distribution
* difficulty mix where applicable

### Avoid

* repeated exact operand pairs in the same session
* overloading one operation type unintentionally
* question types that violate level definition rules

---

## 18. Session Question Storage Strategy

### Important decision

Do **not** rely on seed-only replay as the only storage mechanism.

### Recommended hybrid storage model

For each session, store:

* seed
* generator version
* session config
* timestamps

For each generated question instance shown to the user, store:

* rendered prompt
* correct answer
* metadata tags
* user answer
* response time
* correctness
* skipped flag

### Why

This keeps historical review reliable even if generation logic changes later.

### Note

The seed should still be stored for debugging, reproducibility, and generator validation.

---

## 19. What the App Should Store in General

### User / account level

* user id
* auth info (managed by auth provider / Supabase Auth)
* display name / profile metadata
* preferences if needed later

### Session level

* session id
* user id
* mode
* preset name or custom config
* selected levels
* selected operation filters
* selected number type filters
* finite/open-ended flag
* question count target (if finite)
* timer enabled flag
* timer duration
* started_at
* ended_at
* completed_at
* seed
* generator_version
* score
* accuracy
* average response time
* correct count
* wrong count
* skipped count
* percent within target

### Per-question instance level

* question instance id
* session id
* order shown in session
* prompt shown
* level
* operation_type
* number_type
* variable_position
* target_time_seconds
* correct_answer
* user_answer
* is_correct
* skipped
* response_time_ms
* timestamp answered

### Analytics / derived values

These may be computed rather than stored permanently, depending on implementation:

* recent accuracy
* recent average response time
* streak
* performance by level
* performance by operation
* performance by number type
* percent within target

---

## 20. Accessibility Requirements

The product should be usable accessibly from the start.

### Minimum accessibility requirements

* keyboard-only usable
* clear focus states
* sufficient contrast
* proper labels for inputs and controls
* timer should not rely on color alone
* graphs should have text summaries or labels

---

## 21. Mobile Requirements

The product should work well on phone.

### Mobile design requirements

* responsive layout
* one question clearly visible at a time
* large enough input and controls
* no cluttered dashboard layout on small screens
* graphs responsive and readable

### For v1

* native mobile keyboard is sufficient
* no custom numeric keypad required

---

## 22. Empty State Requirements

### New user empty states

When the user has no data:

* show clean placeholders
* explain that progress will appear after sessions
* include CTA to start Mental Math

### Mistakes empty state

If user has no mistakes:

* show positive empty state like `No mistakes saved yet`

### Statistics empty state

If user has no sessions:

* show placeholder graphs
* explain how to generate statistics

---

## 23. Out of Scope for MVP

Explicitly out of scope:

* leaderboards
* social features
* anti-cheat / tab policing
* webcam or monitoring features
* AI-generated explanations
* adaptive difficulty recommendations
* onboarding tutorials
* multiple active modules beyond Mental Math
* multiple choice mode
* deep gamification beyond streaks

---

## 24. L1–L5 Generation Logic — Current Working Definition

This section captures the current thinking for the Mental Math content logic. It should remain in this document and can be refined during implementation.

The goal is to keep generated content aligned with the researched quant-style question patterns rather than generate arbitrary arithmetic.

### Shared generation principles across all levels

Every generated question should have metadata for:

* level
* operation type
* number type
* variable position
* target time
* exact answer

Generation should respect:

* level-specific difficulty boundaries
* realistic quant-style formats
* balance within the session
* no broken edge cases

---

## 25. Level 1 Definition — Easy

### Core definition

L1 contains very simple arithmetic that resolves in a single mental step.

### Intended characteristics

* single-digit or small 2-digit integers
* no carrying
* no borrowing
* result usually straightforward
* no decimal alignment
* no fraction logic
* minimal working memory load

### Solve-time target

* target solve time: **<= 2 seconds**

### Original examples

1. `8 + 7 = ?`
2. `15 - 6 = ?`
3. `6 × 7 = ?`
4. `35 ÷ 5 = ?`
5. `24 + 13 = ?`

### Why these are L1

* each is nearly immediate
* answer is memorized or obtained in one direct step
* no intermediate working memory burden

### Generator intention

L1 generation should favor:

* basic integers
* direct recall arithmetic
* clean exact results
* low cognitive overhead

### Avoid in L1

* carrying
* borrowing
* decimals
* fractions
* multi-step reverse logic unless extremely trivial

---

## 26. Level 2 Definition — Medium

### Core definition

L2 introduces carrying, borrowing, and small multi-digit mental calculation.

### Intended characteristics

* 2–3 digit integers
* carrying or borrowing may occur
* clean division only
* more than one mental sub-step may be needed
* still relatively structured and arithmetic-first

### Solve-time target

* target solve time: **<= 5 seconds**

### Original examples

1. `373 + 57 = ?`
2. `56 - 29 = ?`
3. `46 + 15 = ?`
4. `108 ÷ 4 = ?`
5. `14 × 8 = ?`

### Why these are L2

* they involve small intermediate steps
* carrying / borrowing introduces working memory demand
* multiplication/division still remain clean enough to be solvable quickly

### Generator intention

L2 generation should favor:

* moderate-size integers
* carrying and borrowing patterns
* clean division with exact quotients
* two-part mental multiplication like `ab × c`

### Avoid in L2

* decimals that require alignment
* fraction arithmetic
* non-clean division
* overly large products or ugly primes

---

## 27. Level 3 Definition — Hard

### Core definition

L3 introduces decimal arithmetic and unknown placement that requires working backward.

### Intended characteristics

* decimals with 1–2 decimal places
* missing-variable placement on left or middle becomes common
* decimal alignment required
* reversing equations becomes more frequent
* division with decimal normalization may appear

### Solve-time target

* target solve time: **<= 7 seconds**

### Original examples

1. `0.58 - 0.3 = ?`
2. `? + 0.04 = 4.42`
3. `0.03 - ? = 0.013`
4. `0.45 ÷ 0.2 = ?`
5. `? ÷ 0.03 = 0.7`

### Why these are L3

* decimal alignment is cognitively heavier than integer arithmetic
* unknown placement requires mentally reversing the operation
* decimal division often requires transformation before solving

### Generator intention

L3 generation should favor:

* decimal arithmetic with consistent but manageable precision
* left-operand and right-operand unknowns
* reversible equations
* decimal division using clean transformations

### Avoid in L3

* messy irrational outcomes
* ugly long decimal tails
* heavy fraction LCM work
* multi-stage fraction/decimal hybrids

---

## 28. Level 4 Definition — Very Hard

### Core definition

L4 introduces fraction arithmetic and operations that require an intermediate transformation step.

### Intended characteristics

* fractions with unlike denominators
* integer divided by fraction
* reciprocal logic
* conversion and LCM work
* no direct one-step solving

### Solve-time target

* target solve time: **<= 10 seconds**

### Original examples

1. `17/9 + ? = 2`
2. `1/6 + ? = 17/24`
3. `8/9 + 24/27 = ?`
4. `25 ÷ 5/7 = ?`
5. `15 ÷ 5/6 = ?`

### Why these are L4

* fractions impose representation overhead
* unlike denominators require conversion
* reciprocal reasoning requires trained mental reflexes
* every item has at least one intermediate step

### Generator intention

L4 generation should favor:

* proper/improper fractions
* unlike denominators with manageable LCMs
* reciprocal division patterns
* mixed fraction logic only if result remains tractable

### Avoid in L4

* denominator explosions
* overly ugly simplification chains
* long mixed decimal-fraction conversions unless clearly intended

---

## 29. Level 5 Definition — Elite

### Core definition

L5 contains the hardest arithmetic patterns in the app, including multi-step operations, pattern recognition, non-obvious factoring, and heavier working memory load.

### Intended characteristics

* multi-step arithmetic
* non-trivial 2x2-digit multiplication or similar
* factor/power recognition
* larger or less obvious decompositions
* mixed representations may appear

### Solve-time target

* target solve time: **<= 15 seconds**

### Original examples

1. `198 ÷ 9 = ?`
2. `49 × ? = 343`
3. `? × 0.13 = 14.3`
4. `0.3 - 4/7 = ?`
5. `17 × 13 = ?`

### Why these are L5

* they often require chunking or restructuring
* some require pattern recognition rather than direct calculation
* some combine multiple transformations before the actual solve
* working memory burden is significantly higher

### Generator intention

L5 generation should favor:

* chunking-friendly but demanding arithmetic
* factor and multiple recognition
* mixed decimal/fraction transformation
* harder but still fair quant-style mental math

### Avoid in L5

* unsalvageably messy arithmetic
* impossible-to-do-in-head values
* questions that feel like written calculation rather than elite mental math

---

## 30. Question Metadata Requirements

Every generated question record should include:

* `id`
* `level`
* `operation_type`
* `number_type`
* `variable_position`
* `target_time_seconds`
* `prompt`
* `correct_answer`
* `generator_version`
* `seed_reference`

If distractors are ever added in future modes, those should also include metadata.

---

## 31. Remaining Logic Still To Refine

The following are intentionally kept as current working logic and should be refined next:

* exact generator constraints per level
* exact quotas for operation distribution by level
* exact variable-position distribution per level
* exact number-type quotas in mixed sessions
* exact test preset mixes and level weighting
* whether some example archetypes should be guaranteed in certain session types

This document preserves the current logic direction so implementation can start while the detailed generator rules are refined.

---

## 32. Final MVP Summary

### What this product is

A modular quant interview prep app whose first working module is Mental Math.

### What users can do in v1

* log in
* open a dashboard with widgets
* start Mental Math practice or tests
* configure or choose a session
* solve one question at a time
* get scored results
* review mistakes
* track trends on a Statistics page

### What should feel true in the final product

* fast to start
* serious and useful for quant prep
* simple enough not to distract from training
* structured enough to make progress visible
* flexible enough to support future modules later

