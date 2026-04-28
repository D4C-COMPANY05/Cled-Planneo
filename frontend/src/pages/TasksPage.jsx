import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, EditPencil } from "iconoir-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const priorityColor = {
  low: "bg-sage/15 text-sage",
  medium: "bg-ochre/25 text-[#8A6A3F]",
  high: "bg-terracotta/15 text-terracotta",
};

const emptyTask = {
  title: "", description: "", priority: "medium", status: "todo",
  due_date: "", category: "", tags: [], subtasks: [], recurrence: "none",
};

const TasksPage = () => {
  const { t } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTask);
  const [subInput, setSubInput] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => { try { setTasks(await api.listTasks()); } catch { toast.error("Error"); } };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm(emptyTask); setEditing(null); setSubInput(""); };
  const openCreate = () => { reset(); setOpen(true); };
  const openEdit = (task) => {
    setEditing(task);
    setForm({ ...task, due_date: task.due_date || "", category: task.category || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error(t("title")); return; }
    try {
      const payload = { ...form, due_date: form.due_date || null };
      if (editing) await api.updateTask(editing.id, payload);
      else await api.createTask(payload);
      toast.success(t("save"));
      setOpen(false); reset(); load();
    } catch { toast.error("Error"); }
  };

  const del = async (id) => {
    if (!window.confirm(t("delete_confirm"))) return;
    try { await api.deleteTask(id); load(); } catch { toast.error("Error"); }
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

  const filtered = tasks.filter((x) => filter === "all" ? true : x.status === filter);

  return (
    <div className="space-y-7" data-testid="tasks-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{t("tasks")}</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-1 italic">{t("tasks")}</h1>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
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
              <div>
                <label className="text-sm font-medium">{t("title")}</label>
                <Input data-testid="task-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t("description")}</label>
                <Textarea data-testid="task-desc-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
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
              <div>
                <label className="text-sm font-medium">{t("recurrence")}</label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger data-testid="task-recurrence-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("recurrence_none")}</SelectItem>
                    <SelectItem value="daily">{t("recurrence_daily")}</SelectItem>
                    <SelectItem value="weekly">{t("recurrence_weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("recurrence_monthly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-stagger">
        {filtered.length === 0 ? (
          <Card className="card-organic p-10 col-span-full text-center text-ink-muted" data-testid="no-tasks-empty">
            {t("no_tasks")}
          </Card>
        ) : filtered.map((task) => (
          <Card key={task.id} className="card-organic p-5 hover:scale-[1.01] transition-transform" data-testid={`task-card-${task.id}`}>
            <div className="flex items-start gap-3">
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
                    <span className="text-sage font-medium">🔁 {t(`recurrence_${task.recurrence}`)}</span>
                  )}
                  {task.recurrence_parent_id && (
                    <span className="text-ink-muted italic text-[11px]">{t("recurrence_occurrence")}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button data-testid={`edit-task-${task.id}`} onClick={() => openEdit(task)} className="p-1.5 text-ink-muted hover:text-sage">
                  <EditPencil className="w-4 h-4" />
                </button>
                <button data-testid={`delete-task-${task.id}`} onClick={() => del(task.id)} className="p-1.5 text-ink-muted hover:text-terracotta">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
