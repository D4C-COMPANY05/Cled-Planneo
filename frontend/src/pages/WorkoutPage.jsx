import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Activity, Plus, Trash, Timer, Pause, Play, FastArrowRight, Xmark } from "iconoir-react";

const CircleTimer = ({ seconds, total, color = "#5A7D6A" }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? seconds / total : 0;
  const dash = circ * pct;
  return (
    <svg width="140" height="140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#F0EDE8" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s linear" }} />
    </svg>
  );
};

const ActiveSession = ({ exercises, restSeconds: defaultRest, lang, onFinish, onAbort }) => {
  const buildSteps = useCallback(() => {
    const steps = [];
    exercises.forEach((ex, ei) => {
      for (let s = 1; s <= ex.sets; s++) {
        steps.push({ type: "work", exIndex: ei, set: s, name: ex.name, duration: ex.duration_seconds > 0 ? ex.duration_seconds : 0, reps: ex.reps });
        const isLastSet = s === ex.sets;
        const isLastEx = ei === exercises.length - 1;
        if (!(isLastSet && isLastEx)) {
          steps.push({ type: "rest", exIndex: ei, set: s, name: ex.name, duration: defaultRest });
        }
      }
    });
    return steps;
  }, [exercises, defaultRest]);

  const steps = buildSteps();
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const current = steps[stepIdx] || null;
  const isTimedStep = current && current.duration > 0;

  useEffect(() => {
    if (!current) return;
    setTimeLeft(isTimedStep ? current.duration : null);
    setPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  useEffect(() => {
    if (timeLeft === null || paused) return;
    if (timeLeft <= 0) { advance(); return; }
    intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, paused]);

  const advance = () => {
    clearInterval(intervalRef.current);
    if (stepIdx + 1 >= steps.length) { onFinish(); return; }
    setStepIdx((i) => i + 1);
  };

  if (!current) return null;

  const isRest = current.type === "rest";
  const workSteps = steps.filter((s) => s.type === "work");
  const doneWork = workSteps.filter((_, i) => steps.indexOf(workSteps[i]) < stepIdx).length;
  const totalWork = workSteps.length;
  const progressPct = Math.round((stepIdx / steps.length) * 100);

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="active-session-modal">
      <Card className="card-organic w-full max-w-md p-8 text-center space-y-6 relative">
        <button onClick={onAbort} className="absolute top-4 right-4 text-ink-muted hover:text-terracotta" data-testid="abort-session-btn">
          <Xmark className="w-5 h-5" />
        </button>
        <div>
          <div className="w-full bg-bone-alt rounded-full h-2">
            <div className="bg-sage h-2 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-ink-muted mt-1">{doneWork}/{totalWork} {lang === "fr" ? "séries" : "sets"}</p>
        </div>
        <div>
          <Badge className={`${isRest ? "bg-ochre/20 text-[#8A6A3F]" : "bg-sage/15 text-sage"} border-0 text-sm px-4 py-1`}>
            {isRest ? (lang === "fr" ? "⏸ Repos" : "⏸ Rest") : (lang === "fr" ? `💪 Série ${current.set}/${exercises[current.exIndex].sets}` : `💪 Set ${current.set}/${exercises[current.exIndex].sets}`)}
          </Badge>
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            {isRest ? (lang === "fr" ? `Prochain : ${steps[stepIdx + 1]?.name || ""}` : `Next: ${steps[stepIdx + 1]?.name || ""}`) : current.name}
          </h2>
          {!isRest && current.reps > 0 && !isTimedStep && (
            <p className="text-ink-muted mt-1">{current.reps} {lang === "fr" ? "répétitions" : "reps"}</p>
          )}
        </div>
        {isTimedStep ? (
          <div className="relative flex items-center justify-center">
            <CircleTimer seconds={timeLeft ?? 0} total={current.duration} color={isRest ? "#C8983B" : "#5A7D6A"} />
            <div className="absolute font-heading text-3xl font-bold">{fmt(timeLeft ?? 0)}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-sage flex items-center justify-center">
              <span className="font-heading text-4xl font-bold text-sage">{current.reps}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {isTimedStep && (
            <Button variant="outline" className="btn-pill w-12 h-12 p-0" onClick={() => setPaused((p) => !p)} data-testid="pause-session-btn">
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
          )}
          <Button className="btn-pill bg-sage hover:bg-sage-dark text-white px-8" onClick={advance} data-testid="advance-session-btn">
            {stepIdx + 1 >= steps.length
              ? (lang === "fr" ? "Terminer ✓" : "Finish ✓")
              : <><FastArrowRight className="w-4 h-4 mr-2" /> {isTimedStep ? (lang === "fr" ? "Passer" : "Skip") : (lang === "fr" ? "Série suivante" : "Next set")}</>}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const WorkoutPage = () => {
  const { t, lang } = useI18n();
  const [exercises, setExercises] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [workoutName, setWorkoutName] = useState(lang === "fr" ? "Séance maison" : "Home workout");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [workoutMin, setWorkoutMin] = useState(20);
  const [restSeconds, setRestSeconds] = useState(60);
  const [selected, setSelected] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    (async () => {
      const [ex, sess] = await Promise.all([api.listExercises(), api.listWorkouts()]);
      setExercises(ex); setSessions(sess);
    })();
  }, []);

  const addExercise = (ex) => {
    if (selected.find((s) => s.exercise_id === ex.id)) return;
    setSelected([...selected, {
      exercise_id: ex.id,
      name: lang === "fr" ? ex.name_fr : ex.name_en,
      sets: ex.default_sets,
      reps: ex.default_reps,
      duration_seconds: ex.duration_seconds,
    }]);
  };
  const updateSel = (id, field, val) => setSelected(selected.map((s) => s.exercise_id === id ? { ...s, [field]: Number(val) || 0 } : s));
  const removeSel = (id) => setSelected(selected.filter((s) => s.exercise_id !== id));

  const saveSession = async () => {
    if (selected.length === 0) { toast.error(t("no_exercise_selected")); return; }
    try {
      await api.createWorkout({ date: workoutDate, name: workoutName, duration_minutes: workoutMin, exercises: selected });
      toast.success(lang === "fr" ? "Séance enregistrée" : "Session saved");
      setSelected([]);
      setSessions(await api.listWorkouts());
    } catch { toast.error("Error"); }
  };

  const startSession = () => {
    if (selected.length === 0) { toast.error(t("no_exercise_selected")); return; }
    setSessionActive(true);
  };

  const handleFinish = async () => {
    setSessionActive(false);
    toast.success(lang === "fr" ? "🎉 Séance terminée !" : "🎉 Session complete!");
    await saveSession();
  };

  const handleAbort = () => {
    setSessionActive(false);
    toast(lang === "fr" ? "Séance interrompue" : "Session aborted");
  };

  const delSession = async (id) => { await api.deleteWorkout(id); setSessions(await api.listWorkouts()); };
  const filteredEx = exercises.filter((ex) => filter === "all" ? true : ex.muscle_group === filter);
  const diffBadge = { easy: "bg-sage/15 text-sage", medium: "bg-ochre/25 text-[#8A6A3F]", hard: "bg-terracotta/15 text-terracotta" };

  return (
    <div className="space-y-7" data-testid="workout-page">
      {sessionActive && (
        <ActiveSession exercises={selected} restSeconds={restSeconds} lang={lang} onFinish={handleFinish} onAbort={handleAbort} />
      )}

      <section
        className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-border"
        style={{
          backgroundImage: "linear-gradient(120deg, rgba(210,106,77,0.86), rgba(90,125,106,0.5)), url(https://images.unsplash.com/photo-1760084081757-6f918c08403b?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80)",
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        <div className="px-6 py-10 md:px-12 md:py-16 text-white">
          <div className="text-[11px] uppercase tracking-[0.25em] opacity-90">{t("workout")}</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-2 leading-tight italic">
            {lang === "fr" ? "Bouger, sans matériel." : "Move, no gear needed."}
          </h1>
          <p className="mt-3 opacity-90 max-w-xl">
            {lang === "fr" ? "Construisez une séance, lancez le timer, suivez vos séries." : "Build a session, start the timer, track your sets."}
          </p>
        </div>
      </section>

      <div className="flex gap-2 flex-wrap">
        {[
          { k: "all", l: lang === "fr" ? "Tous" : "All" },
          { k: "full_body", l: t("full_body") },
          { k: "upper", l: t("upper") },
          { k: "lower", l: t("lower") },
          { k: "core", l: t("core") },
          { k: "cardio", l: t("cardio") },
        ].map((f) => (
          <button key={f.k} data-testid={`muscle-filter-${f.k}`} onClick={() => setFilter(f.k)}
            className={`btn-pill px-4 py-1.5 text-sm border transition-all duration-300 ${
              filter === f.k ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:border-ink"
            }`}>{f.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading text-2xl font-medium">{t("exercises_library")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-stagger">
            {filteredEx.map((ex) => (
              <Card key={ex.id} className="card-organic p-5" data-testid={`exercise-card-${ex.id}`}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-heading text-lg font-medium">{lang === "fr" ? ex.name_fr : ex.name_en}</h3>
                  <Badge className={`${diffBadge[ex.difficulty]} border-0 capitalize shrink-0`}>{t(ex.difficulty)}</Badge>
                </div>
                <p className="text-sm text-ink-muted mt-2">{lang === "fr" ? ex.description_fr : ex.description_en}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-ink-muted uppercase tracking-widest">{t(ex.muscle_group)}</span>
                  <Button data-testid={`add-exercise-${ex.id}`} onClick={() => addExercise(ex)} size="sm" className="btn-pill bg-sage hover:bg-sage-dark text-white">
                    <Plus className="w-4 h-4 mr-1" /> {t("add_to_workout")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="card-organic p-5" data-testid="session-builder-card">
            <h2 className="font-heading text-xl font-medium mb-4">{t("start_workout")}</h2>
            <div className="space-y-3">
              <Input data-testid="workout-name-input" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder={t("workout_name")} />
              <div className="grid grid-cols-2 gap-2">
                <Input data-testid="workout-date-input" type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)} />
                <Input data-testid="workout-min-input" type="number" min="1" value={workoutMin} onChange={(e) => setWorkoutMin(Number(e.target.value) || 1)} placeholder={t("duration_minutes")} />
              </div>
              <div>
                <label className="text-xs text-ink-muted font-medium">{lang === "fr" ? "Repos entre séries (s)" : "Rest between sets (s)"}</label>
                <div className="flex gap-2 mt-1">
                  {[30, 45, 60, 90].map((s) => (
                    <button key={s} onClick={() => setRestSeconds(s)} data-testid={`rest-${s}-btn`}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${
                        restSeconds === s ? "bg-ochre text-white border-ochre" : "bg-white border-border text-ink-muted hover:border-ochre"
                      }`}>{s}s</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-2">{t("selected_exercises")}</h3>
              {selected.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("no_exercise_selected")}</p>
              ) : (
                <ul className="space-y-3">
                  {selected.map((s) => (
                    <li key={s.exercise_id} className="border border-border rounded-xl p-3" data-testid={`selected-${s.exercise_id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <button data-testid={`remove-selected-${s.exercise_id}`} onClick={() => removeSel(s.exercise_id)} className="text-ink-muted hover:text-terracotta"><Trash className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="text-xs text-ink-muted">{t("sets")}</label>
                          <Input className="h-9" type="number" value={s.sets} onChange={(e) => updateSel(s.exercise_id, "sets", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-ink-muted">{t("reps")}</label>
                          <Input className="h-9" type="number" value={s.reps} onChange={(e) => updateSel(s.exercise_id, "reps", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-ink-muted">{t("duration_seconds")}</label>
                          <Input className="h-9" type="number" value={s.duration_seconds} onChange={(e) => updateSel(s.exercise_id, "duration_seconds", e.target.value)} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <Button data-testid="start-session-btn" onClick={startSession} className="btn-pill bg-sage hover:bg-sage-dark text-white flex-1">
                <Timer className="w-4 h-4 mr-2" /> {lang === "fr" ? "Lancer ▶" : "Start ▶"}
              </Button>
              <Button data-testid="save-workout-btn" onClick={saveSession} variant="outline" className="btn-pill border-terracotta text-terracotta hover:bg-terracotta/10 flex-1">
                <Activity className="w-4 h-4 mr-2" /> {t("save_workout")}
              </Button>
            </div>
          </Card>

          <Card className="card-organic p-5" data-testid="workout-history-card">
            <h2 className="font-heading text-xl font-medium mb-4">{t("workout_history")}</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("no_workouts")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {sessions.map((w) => (
                  <li key={w.id} className="py-3" data-testid={`session-${w.id}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-ink-muted flex items-center gap-2">
                          <span>{format(parseISO(w.date), "d MMM yyyy")}</span>
                          <Timer className="w-3 h-3" /> <span>{w.duration_minutes} {t("minutes")}</span>
                        </div>
                        <div className="text-xs text-ink-muted mt-1">{w.exercises.map((e) => e.name).join(" · ")}</div>
                      </div>
                      <button data-testid={`delete-session-${w.id}`} onClick={() => delSession(w.id)} className="text-ink-muted hover:text-terracotta"><Trash className="w-4 h-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPage;
