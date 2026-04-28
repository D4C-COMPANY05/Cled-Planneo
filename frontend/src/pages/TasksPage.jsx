import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, EditPencil, Timer, Pause } from "iconoir-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const priorityColor = {
  low: "bg-sage/15 text-sage",
  medium: "bg-ochre/25 text-[#8A6A3F]",
  high: "bg-terracotta/15 text-terracotta",
};

const DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mer" },
  { key: "thu", label: "Jeu" },
  { key: "fri", label: "Ven" },
  { key: "sat", label: "Sam" },
  { key: "sun", label: "Dim" },
];

const emptyTask = {
  title: "", description: "", priority: "medium", status: "todo",
  due_date: "", category: "", tags: [], subtasks: [], recurrence: "none",
  recurrence_days: [], duration_minutes: "",
};

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown() {
  const [timers, setTimers] = useState({}); // { taskId: { remaining, running } }
  const intervals = useRef({});

  const start = (taskId, totalSeconds) => {
    if (intervals.current[taskId]) return; // already running
    setTimers((prev) => ({ ...prev, [taskId]: { remaining: totalSeconds, running: true } }));
    intervals.current[taskId] = setInterval(() => {
      setTimers((prev) => {
        const cur = prev[taskId];
        if (!cur || cur.remaining <= 0) {
          clearInterval(intervals.current[taskId]);
          delete intervals.current[taskId];
          return { ...prev, [taskId]: { remaining: 0, running: false } };
        }
        return { ...prev, [taskId]: { ...cur, remaining: cur.remaining - 1 } };
      });
    }, 1000);
  };

  const stop = (taskId) => {
    clearInterval(intervals.current[taskId]);
    delete intervals.current[taskId];
    setTimers((prev) => {
      const cur = prev[taskId];
      return { ...prev, [taskId]: { ...cur, running: false } };
    });
  };

  const reset = (taskId) => {
    stop(taskId);
    setTimers((prev) => {
      const { [taskId]: _, ...rest } = prev;
      return rest;
    });
  };

  const fmt = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return { timers, start, stop, reset, fmt };
}

// ── Component ─────────────────────────────────────────────────────────────────
const TasksPage = () => {
  const { t } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTask);
  const [subInput, setSubInput] = useState("");
  const [filter, setFilter] = useState("all");
  const { timers, start, stop, reset: resetTimer, fmt } = useCountdown();

  const load = async () => { try { setTasks(await api.listTasks()); } catch { toast.error("Error"); } };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyTask); setEditing(null); setSubInput(""); };
  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (task) => {
    setEditing(task);
    setForm({
      ...task,
      due_date: task.due_date || "",
      category: task.category || "",
      recurrence_days: task.recurrence_days || [],
      duration_minutes: task.duration_minutes || "",
    });
    setOpen(true);
  };

  const toggleDay = (day) => {
    const days = form.recurrence_days || [];
    setForm({
      ...form,
      recurrence_days: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    });
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error(t("title")); return; }
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        recurrence_days: form.recurrence === "weekly" ? (form.recurrence_days || []) : [],
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      };
      if (editing) await api.updateTask(editing.id, payload);
      else await api.createTask(payload);
      toast.success(t("save"));
      setOpen(false); resetForm(); load();
    } catch { toast.error("Error"); }
  };

  const del = async (id) => {
    if (!window.confirm(t("delete_confirm"))) return;
    try { await api.deleteTask(id); resetTimer(id); load(); } catch { toast.error("Error"); }
  };

  const toggleDone = async (task) => {
    await api.updateTask(task.id, { status: task.status === "done" ? "todo" : "done" });
    load();
  };

  const addSub = () => {
    if (!subInput.trim()) return;
    setForm({ ...form, subtasks: [...form.subtasks, { id: `tmp-${Date.now()}`, title: subInput.trim(), done: false }] });
    setSubInput("");
  };
  const removeSub = (id) => setForm({ ...form, subtasks: form.subtasks.filter((s) => s.id !== id) });
  const toggleSub = (id) => setForm({ ...form, subtasks: form.subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s) });

  const handleTimer = (task) => {
    const timer = timers[task.id];
    if (!timer) {
      const secs = (task.duration_minutes || 0) * 60;
      if (!secs) { toast.error("Aucune durée définie pour cette tâche"); return; }
      start(task.id, secs);
    } else if (timer.running) {
      stop(task.id);
    } else if (timer.remaining > 0) {
      start(task.id, timer.remaining);
    } else {
      resetTimer(task.id);
    }
  };

  const filtered = tasks.filter((x) => filter === "all" ? true : x.status === filter);

  return (
    <div className="space-y-7" data-testid="tasks-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{t("tasks")}</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-1 italic">{t("tasks")}</h1>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="open-new-task-btn" onClick={openCreate} className="btn-pill bg-sage hover:bg-sage-dark text-white">
              <Plus className="w-4 h-4 mr-2" /> {t("new_task")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">{editing ? t("edit") : t("new_task")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Title */}
              <div>
                <label className="text-sm font-medium">{t("title")}</label>
                <Input data-testid="task-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              {/* Description */}
              <div>
                <label className="text-sm font-medium">{t("description")}</label>
                <Textarea data-testid="task-desc-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">{t("priority")}</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger data-testid="task-priority-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("low")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="high">{t("high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("status")}</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger data-testid="task-status-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">{t("todo")}</SelectItem>
                      <SelectItem value="in_progress">{t("in_progress")}</SelectItem>
                      <SelectItem value="done">{t("done")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Due date + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">{t("due_date")}</label>
                  <Input data-testid="task-due-input" type="date" value={form.due_date ? form.due_date.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("category")}</label>
                  <Input data-testid="task-category-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              {/* Duration */}
              <div>
                <label className="text-sm font-medium">⏱ Durée (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 25"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
                <p className="text-xs text-ink-muted mt-1">Laisse vide si pas de timer</p>
              </div>
              {/* Recurrence */}
              <div>
                <label className="text-sm font-medium">{t("recurrence")}</label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v, recurrence_days: [] })}>
                  <SelectTrigger data-testid="task-recurrence-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("recurrence_none")}</SelectItem>
                    <SelectItem value="daily">{t("recurrence_daily")}</SelectItem>
                    <SelectItem value="weekly">{t("recurrence_weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("recurrence_monthly")}</SelectItem>
                  </SelectContent>
                </Select>
                {/* Day picker for weekly */}
                {form.recurrence === "weekly" && (
                  <div className="mt-2">
                    <p className="text-xs text-ink-muted mb-1.5">Choisir les jours :</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDay(d.key)}
                          className={`w-9 h-9 rounded-full text-xs font-medium border transition-all ${
                            (form.recurrence_days || []).includes(d.key)
                              ? "bg-sage text-white border-sage"
                              : "bg-white text-ink-muted border-border hover:border-sage"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Subtasks */}
              <div>
                <label className="text-sm font-medium">{t("subtasks")}</label>
                <div className="flex gap-2 mt-1">
                  <Input data-testid="subtask-input" value={subInput} onChange={(e) => setSubInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} />
                  <Button type="button" data-testid="add-subtask-btn" onClick={addSub} variant="outline" className="btn-pill">{t("add")}</Button>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {form.subtasks.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} />
                      <span className={s.done ? "line-through text-ink-muted" : ""}>{s.title}</span>
                      <button onClick={() => removeSub(s.id)} className="ml-auto text-ink-muted hover:text-terracotta">
                        <Trash className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="btn-pill">{t("cancel")}</Button>
              <Button data-testid="save-task-btn" onClick={save} className="btn-pill bg-sage hover:bg-sage-dark text-white">{t("save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { k: "all", l: "Tous / All" },
          { k: "todo", l: t("todo") },
          { k: "in_progress", l: t("in_progress") },
          { k: "done", l: t("done") },
        ].map((f) => (
          <button
            key={f.k}
            data-testid={`filter-${f.k}-btn`}
            onClick={() => setFilter(f.k)}
            className={`btn-pill px-4 py-1.5 text-sm border transition-all duration-300 ${
              filter === f.k ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:border-ink"
            }`}
          >{f.l}</button>
        ))}
      </div>

      {/* Task cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-stagger">
        {filtered.length === 0 ? (
          <Card className="card-organic p-10 col-span-full text-center text-ink-muted" data-testid="no-tasks-empty">
            {t("no_tasks")}
          </Card>
        ) : filtered.map((task) => {
          const timer = timers[task.id];
          const isRunning = timer?.running;
          const isDone = timer?.remaining === 0 && !timer?.running;
          const hasDuration = !!task.duration_minutes;

          return (
            <Card key={task.id} className="card-organic p-5 hover:scale-[1.01] transition-transform" data-testid={`task-card-${task.id}`}>
              <div className="flex items-start gap-3">
                {/* Done toggle */}
                <button data-testid={`task-check-${task.id}`} onClick={() => toggleDone(task)}
                  className={`w-5 h-5 mt-1 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.status === "done" ? "bg-sage border-sage" : "border-ink-muted hover:border-sage"
                  }`}>
                  {task.status === "done" && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-heading text-lg font-medium ${task.status === "done" ? "line-through text-ink-muted" : ""}`}>{task.title}</h3>
                    <Badge className={`${priorityColor[task.priority]} border-0 capitalize`}>{t(task.priority)}</Badge>
                    {task.category && <Badge variant="outline" className="border-border text-ink-muted">{task.category}</Badge>}
                  </div>
                  {task.description && <p className="text-sm text-ink-muted mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted flex-wrap">
                    {task.due_date && <span>📅 {format(parseISO(task.due_date), "d MMM yyyy")}</span>}
                    {task.subtasks?.length > 0 && <span>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} ✓</span>}
                    {task.recurrence && task.recurrence !== "none" && !task.recurrence_parent_id && (
                      <span className="text-sage font-medium">
                        🔁 {t(`recurrence_${task.recurrence}`)}
                        {task.recurrence === "weekly" && task.recurrence_days?.length > 0 && (
                          <span className="ml-1 normal-case">
                            ({task.recurrence_days.map((d) => DAYS.find((x) => x.key === d)?.label).join(", ")})
                          </span>
                        )}
                      </span>
                    )}
                    {task.recurrence_parent_id && (
                      <span className="text-ink-muted italic text-[11px]">{t("recurrence_occurrence")}</span>
                    )}
                    {hasDuration && !timer && (
                      <span className="text-ink-muted">⏱ {task.duration_minutes} min</span>
                    )}
                  </div>

                  {/* Timer display */}
                  {timer && (
                    <div className={`mt-2 flex items-center gap-2 text-sm font-mono font-semibold ${
                      isDone ? "text-sage" : isRunning ? "text-terracotta" : "text-ink-muted"
                    }`}>
                      {isDone ? (
                        <span>✅ Terminé !</span>
                      ) : (
                        <>
                          <span>⏱ {fmt(timer.remaining)}</span>
                          {!isRunning && <span className="text-xs font-sans text-ink-muted">(en pause)</span>}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1">
                  {/* Timer button */}
                  {hasDuration && (
                    <button
                      onClick={() => handleTimer(task)}
                      title={isRunning ? "Pause" : timer?.remaining === 0 ? "Réinitialiser" : "Démarrer"}
                      className={`p-1.5 transition-colors ${
                        isRunning ? "text-terracotta hover:text-terracotta/70"
                        : isDone ? "text-sage hover:text-sage/70"
                        : "text-ink-muted hover:text-sage"
                      }`}
                    >
                      {isRunning ? <Pause className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                    </button>
                  )}
                  <button data-testid={`edit-task-${task.id}`} onClick={() => openEdit(task)} className="p-1.5 text-ink-muted hover:text-sage">
                    <EditPencil className="w-4 h-4" />
                  </button>
                  <button data-testid={`delete-task-${task.id}`} onClick={() => del(task.id)} className="p-1.5 text-ink-muted hover:text-terracotta">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TasksPage;
