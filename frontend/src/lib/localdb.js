// localStorage-backed "database" for Cled's Plannéo
// No backend, no network. All data stays on this device.

const KEYS = {
  tasks: "cled_tasks_v1",
  categories: "cled_categories_v1",
  sleep: "cled_sleep_v1",
  workouts: "cled_workouts_v1",
  exercises: "cled_exercises_v1",
  sleepGoals: "cled_sleep_goals_v1",
  recurringMeta: "cled_recurring_meta_v1",
};

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
const nowIso = () => new Date().toISOString();

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ── Seed exercises (runs once) ────────────────────────────────────────────────
const HOME_EXERCISES = [
  { id: "ex-pushup", name_fr: "Pompes", name_en: "Push-ups", muscle_group: "upper", difficulty: "medium", default_sets: 3, default_reps: 12, duration_seconds: 0, description_fr: "Mains au sol écartées des épaules, corps droit, descendez la poitrine vers le sol et poussez.", description_en: "Hands on the floor shoulder-width apart, body straight, lower chest to the floor and push up." },
  { id: "ex-squat", name_fr: "Squats", name_en: "Squats", muscle_group: "lower", difficulty: "easy", default_sets: 3, default_reps: 15, duration_seconds: 0, description_fr: "Pieds largeur des épaules, descendez comme pour vous asseoir, cuisses parallèles au sol, remontez.", description_en: "Feet shoulder-width apart, squat down like sitting on a chair, thighs parallel to floor, stand back up." },
  { id: "ex-plank", name_fr: "Gainage (Planche)", name_en: "Plank", muscle_group: "core", difficulty: "medium", default_sets: 3, default_reps: 1, duration_seconds: 45, description_fr: "Sur les avant-bras, corps aligné tête aux pieds, contractez les abdos et tenez la position.", description_en: "On your forearms, body aligned head to feet, tighten your core and hold the position." },
  { id: "ex-lunge", name_fr: "Fentes", name_en: "Lunges", muscle_group: "lower", difficulty: "easy", default_sets: 3, default_reps: 12, duration_seconds: 0, description_fr: "Un pied en avant, descendez jusqu'à ce que le genou arrière frôle le sol, revenez.", description_en: "Step one foot forward, lower until back knee nearly touches the floor, return." },
  { id: "ex-burpee", name_fr: "Burpees", name_en: "Burpees", muscle_group: "full_body", difficulty: "hard", default_sets: 3, default_reps: 10, duration_seconds: 0, description_fr: "Debout, squat, pompe, saut en l'air. Enchaînez dynamiquement.", description_en: "Stand, squat, push-up, jump up. Chain movements dynamically." },
  { id: "ex-mountain-climber", name_fr: "Montées de genoux (Mountain climbers)", name_en: "Mountain Climbers", muscle_group: "cardio", difficulty: "medium", default_sets: 3, default_reps: 1, duration_seconds: 30, description_fr: "En position de planche, ramenez alternativement les genoux vers la poitrine rapidement.", description_en: "In plank position, alternately drive knees to chest as fast as possible." },
  { id: "ex-jumping-jack", name_fr: "Jumping jacks", name_en: "Jumping Jacks", muscle_group: "cardio", difficulty: "easy", default_sets: 3, default_reps: 1, duration_seconds: 45, description_fr: "Sautez en écartant bras et jambes puis revenez. Cardio doux pour s'échauffer.", description_en: "Jump spreading arms and legs out, then back. A gentle cardio warm-up." },
  { id: "ex-crunch", name_fr: "Crunchs", name_en: "Crunches", muscle_group: "core", difficulty: "easy", default_sets: 3, default_reps: 20, duration_seconds: 0, description_fr: "Allongé sur le dos, genoux pliés, relevez le buste en contractant les abdominaux.", description_en: "Lying on your back, knees bent, lift your torso by contracting your abs." },
  { id: "ex-glute-bridge", name_fr: "Pont fessier", name_en: "Glute Bridge", muscle_group: "lower", difficulty: "easy", default_sets: 3, default_reps: 15, duration_seconds: 0, description_fr: "Sur le dos, genoux pliés, montez le bassin en serrant les fessiers.", description_en: "On your back, knees bent, lift hips by squeezing your glutes." },
  { id: "ex-superman", name_fr: "Superman", name_en: "Superman", muscle_group: "upper", difficulty: "easy", default_sets: 3, default_reps: 12, duration_seconds: 0, description_fr: "Allongé sur le ventre, soulevez simultanément bras et jambes, tenez 2 secondes.", description_en: "Lying on your stomach, lift arms and legs together, hold 2 seconds." },
  { id: "ex-high-knees", name_fr: "Genoux hauts", name_en: "High Knees", muscle_group: "cardio", difficulty: "medium", default_sets: 3, default_reps: 1, duration_seconds: 30, description_fr: "Courez sur place en montant les genoux le plus haut possible.", description_en: "Run in place bringing knees as high as possible." },
  { id: "ex-wall-sit", name_fr: "Chaise (contre le mur)", name_en: "Wall Sit", muscle_group: "lower", difficulty: "medium", default_sets: 3, default_reps: 1, duration_seconds: 45, description_fr: "Dos contre un mur, cuisses à 90°, tenez la position.", description_en: "Back against a wall, thighs at 90°, hold the position." },
];

function seed() {
  if (!localStorage.getItem(KEYS.exercises)) write(KEYS.exercises, HOME_EXERCISES);
  if (!localStorage.getItem(KEYS.tasks)) write(KEYS.tasks, []);
  if (!localStorage.getItem(KEYS.categories)) write(KEYS.categories, []);
  if (!localStorage.getItem(KEYS.sleep)) write(KEYS.sleep, []);
  if (!localStorage.getItem(KEYS.workouts)) write(KEYS.workouts, []);
  if (!localStorage.getItem(KEYS.sleepGoals)) write(KEYS.sleepGoals, { id: "singleton", target_hours: 8, target_bedtime: "23:00", updated_at: nowIso() });
}
seed();

function calcDuration(bedtime, wake_time) {
  try {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wake_time.split(":").map(Number);
    const bed = bh * 60 + bm;
    const wake = wh * 60 + wm;
    let diff = wake - bed;
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 100) / 100;
  } catch {
    return 0;
  }
}

// ── Recurring tasks generator (runs on app load) ──────────────────────────────
function generateRecurring() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tasks = read(KEYS.tasks, []);
  const parents = tasks.filter((t) => ["daily", "weekly", "monthly"].includes(t.recurrence) && !t.recurrence_parent_id);

  let changed = false;
  parents.forEach((p) => {
    let expected;
    if (p.recurrence === "daily") expected = todayStr;
    else if (p.recurrence === "weekly") {
      const d = new Date(today);
      const day = (d.getDay() + 6) % 7; // Monday-based
      d.setDate(d.getDate() - day);
      expected = d.toISOString().slice(0, 10);
    } else if (p.recurrence === "monthly") {
      expected = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    } else return;

    const exists = tasks.some((t) => t.recurrence_parent_id === p.id && t.due_date === expected);
    if (!exists) {
      tasks.push({
        id: uid(),
        title: p.title,
        description: p.description || "",
        priority: p.priority || "medium",
        status: "todo",
        due_date: expected,
        category: p.category || null,
        tags: p.tags || [],
        subtasks: [],
        recurrence: "none",
        recurrence_parent_id: p.id,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      changed = true;
    }
  });
  if (changed) write(KEYS.tasks, tasks);
}
generateRecurring();

// ── Tasks ─────────────────────────────────────────────────────────────────────
const tasks = {
  list: () => read(KEYS.tasks, []).slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")),
  create: (payload) => {
    const all = read(KEYS.tasks, []);
    const t = {
      id: uid(),
      title: payload.title,
      description: payload.description || "",
      priority: payload.priority || "medium",
      status: payload.status || "todo",
      due_date: payload.due_date || null,
      category: payload.category || null,
      tags: payload.tags || [],
      subtasks: (payload.subtasks || []).map((s) => ({ id: s.id?.startsWith("tmp-") || !s.id ? uid() : s.id, title: s.title, done: !!s.done })),
      recurrence: payload.recurrence || "none",
      recurrence_parent_id: payload.recurrence_parent_id || null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    all.push(t);
    write(KEYS.tasks, all);
    return t;
  },
  update: (id, patch) => {
    const all = read(KEYS.tasks, []);
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error("Task not found");
    const updated = { ...all[idx], ...patch, updated_at: nowIso() };
    if (patch.subtasks) {
      updated.subtasks = patch.subtasks.map((s) => ({ id: s.id?.startsWith("tmp-") || !s.id ? uid() : s.id, title: s.title, done: !!s.done }));
    }
    all[idx] = updated;
    write(KEYS.tasks, all);
    return updated;
  },
  remove: (id) => {
    const all = read(KEYS.tasks, []).filter((x) => x.id !== id);
    write(KEYS.tasks, all);
    return { ok: true };
  },
};

// ── Categories ────────────────────────────────────────────────────────────────
const categories = {
  list: () => read(KEYS.categories, []),
  create: (payload) => {
    const all = read(KEYS.categories, []);
    const c = { id: uid(), name: payload.name, color: payload.color || "#5A7D6A", created_at: nowIso() };
    all.push(c);
    write(KEYS.categories, all);
    return c;
  },
  remove: (id) => {
    write(KEYS.categories, read(KEYS.categories, []).filter((x) => x.id !== id));
    return { ok: true };
  },
};

// ── Sleep ─────────────────────────────────────────────────────────────────────
const sleep = {
  list: () => read(KEYS.sleep, []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")),
  create: (payload) => {
    const all = read(KEYS.sleep, []);
    const entry = {
      id: uid(),
      date: payload.date,
      bedtime: payload.bedtime,
      wake_time: payload.wake_time,
      duration_hours: calcDuration(payload.bedtime, payload.wake_time),
      quality: payload.quality ?? 3,
      notes: payload.notes || "",
      created_at: nowIso(),
    };
    all.push(entry);
    write(KEYS.sleep, all);
    return entry;
  },
  remove: (id) => {
    write(KEYS.sleep, read(KEYS.sleep, []).filter((x) => x.id !== id));
    return { ok: true };
  },
  getGoals: () => read(KEYS.sleepGoals, { id: "singleton", target_hours: 8, target_bedtime: "23:00", updated_at: nowIso() }),
  updateGoals: (payload) => {
    const goal = { id: "singleton", target_hours: payload.target_hours ?? 8, target_bedtime: payload.target_bedtime || "23:00", updated_at: nowIso() };
    write(KEYS.sleepGoals, goal);
    return goal;
  },
  getStreak: () => {
    const goal = sleep.getGoals();
    const entries = read(KEYS.sleep, []);
    const byDate = Object.fromEntries(entries.map((e) => [e.date, e.duration_hours]));
    let streak = 0;
    const today = new Date();
    let check = new Date(today);
    check.setDate(check.getDate() - 1);
    while (true) {
      const k = check.toISOString().slice(0, 10);
      if (byDate[k] !== undefined && byDate[k] >= goal.target_hours) {
        streak += 1;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return { streak, target_hours: goal.target_hours };
  },
};

// ── Workouts ──────────────────────────────────────────────────────────────────
const workouts = {
  list: () => read(KEYS.workouts, []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")),
  create: (payload) => {
    const all = read(KEYS.workouts, []);
    const s = {
      id: uid(),
      date: payload.date,
      name: payload.name || "Home Workout",
      duration_minutes: payload.duration_minutes || 20,
      exercises: payload.exercises || [],
      notes: payload.notes || "",
      created_at: nowIso(),
    };
    all.push(s);
    write(KEYS.workouts, all);
    return s;
  },
  remove: (id) => {
    write(KEYS.workouts, read(KEYS.workouts, []).filter((x) => x.id !== id));
    return { ok: true };
  },
  listExercises: () => read(KEYS.exercises, HOME_EXERCISES),
};

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = {
  compute: () => {
    const allTasks = read(KEYS.tasks, []);
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === "done").length;
    const todo = allTasks.filter((t) => t.status === "todo").length;
    const in_progress = allTasks.filter((t) => t.status === "in_progress").length;

    const today = new Date();
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const allSleep = read(KEYS.sleep, []);
    const sleepsIn = allSleep.filter((s) => last7.includes(s.date));
    const avg_sleep = Math.round((sleepsIn.reduce((a, s) => a + (s.duration_hours || 0), 0) / 7) * 100) / 100;

    const allWorkouts = read(KEYS.workouts, []);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const wkStr = weekAgo.toISOString().slice(0, 10);
    const weekWorkouts = allWorkouts.filter((w) => w.date >= wkStr);

    const daily = {};
    [...Array(7)].forEach((_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily[key] = { date: key, created: 0, completed: 0 };
    });
    allTasks.forEach((t) => {
      const cd = (t.created_at || "").slice(0, 10);
      if (daily[cd]) daily[cd].created += 1;
      if (t.status === "done") {
        const ud = (t.updated_at || "").slice(0, 10);
        if (daily[ud]) daily[ud].completed += 1;
      }
    });

    return {
      tasks: {
        total, done, todo, in_progress,
        completion_rate: total ? Math.round((done / total) * 1000) / 10 : 0,
      },
      sleep: {
        avg_hours_last_7: avg_sleep,
        entries_count: sleepsIn.length,
        last_7_days: sleepsIn.slice().sort((a, b) => b.date.localeCompare(a.date)),
      },
      workouts: {
        week_count: weekWorkouts.length,
        week_minutes: weekWorkouts.reduce((a, w) => a + (w.duration_minutes || 0), 0),
        last_sessions: allWorkouts.slice(0, 7),
      },
      daily_activity: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
};

export const localdb = { tasks, categories, sleep, workouts, stats, KEYS };
