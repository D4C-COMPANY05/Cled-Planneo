# Cled's Plannéo — PRD

## Original Problem Statement
> A partir de celui là en utilisant la local storage comme base de données puisque c une appli personnel que je veux et je veux changer le nom dele'appli en utilisant mon nom qui est Cled dans ce nom

Translation: Take the existing Plannéo app, migrate it to use localStorage (no backend) because it's a personal app, and rename it to include my name (Cled). Mobile-first.

## User Choices (confirmed via ask_human)
- App name: **Cled's Plannéo**
- Storage: **100% localStorage, no backend** (mobile/personal app)
- Features: **conserve all** original features
- Design: **new, modern, personalized, mobile-first**

## Personas
- **Cled** (single user) — mobile-first personal productivity: tasks, sleep, workouts, stats.

## Architecture
- React 19 + Tailwind + shadcn/ui + recharts + react-day-picker + iconoir-react.
- All state in `localStorage` via `/app/frontend/src/lib/localdb.js`.
- `/app/frontend/src/lib/api.js` wraps localdb behind the exact same async interface the original pages used, so the UI code is untouched in behavior.
- Backend (FastAPI/MongoDB) remains installed in the template but is **NOT CALLED** by the frontend. Zero `/api/*` network requests.
- localStorage keys (prefix `cled_`): `cled_tasks_v1`, `cled_categories_v1`, `cled_sleep_v1`, `cled_workouts_v1`, `cled_exercises_v1` (seeded with 12 bodyweight exercises), `cled_sleep_goals_v1` (singleton).
- Recurring tasks: generator runs on app load; creates daily/weekly/monthly occurrences.

## Implemented (Feb 2026)
- "Cled's Plannéo" brand with italic `Cled's` wordmark + terracotta `o` in `Plannéo`.
- Time-based greeting "Bonjour/Bonsoir Cled" on Dashboard.
- Mobile-first layout: top bar + **6-tab bottom nav** (z-index 99999 above Emergent badge).
- Desktop sidebar preserved.
- Pages: Dashboard (stat cards + quick-add), Tasks (CRUD + filters + recurrence + subtasks), Calendar (shadcn calendar with dot markers), Sleep (log + streak + goal settings), Workout (exercise library + live session modal with circle timer + rest/work phases), Stats (Recharts BarChart / PieChart / LineChart).
- Bilingual FR/EN toggle persists via `localStorage.lang`.
- Typography: **Fraunces** (italic serif) for headings — replaces earlier Outfit for a more distinctive, on-brand look.
- Safe-area insets applied to mobile header & bottom nav.

## Backlog / Future Enhancements
- P1: Export/import data as JSON (backup).
- P1: Reminders / local notifications (Web Notifications API).
- P2: PWA manifest + offline installability (truly "app-like" on phone).
- P2: Dark mode.
- P2: Multi-device sync (opt-in, e.g. via user-chosen cloud).

## Test Status
- Iteration 1: 92% pass. Fixed: mobile bottom-nav tabs (Sleep/Workout/Stats) were blocked by Emergent badge overlay — resolved with z-index 99999.
- Zero backend calls verified.
