import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle, HalfMoon as Moon, Activity } from "iconoir-react";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";

const StatCard = ({ icon: Icon, label, value, subtitle, tone = "sage", testId }) => {
  const toneMap = {
    sage: "bg-sage/10 text-sage",
    terracotta: "bg-terracotta/10 text-terracotta",
    ochre: "bg-ochre/20 text-[#8A6A3F]",
  };
  return (
    <div className="card-organic p-5 sm:p-6" data-testid={testId}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${toneMap[tone]} mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{label}</div>
      <div className="font-heading text-3xl font-semibold mt-1 text-ink">{value}</div>
      {subtitle && <div className="text-sm text-ink-muted mt-1">{subtitle}</div>}
    </div>
  );
};

const DashboardPage = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [quick, setQuick] = useState("");

  const load = async () => {
    try {
      const [s, ts] = await Promise.all([api.getStats(), api.listTasks()]);
      setStats(s);
      setTasks(ts);
    } catch {
      toast.error("Failed to load");
    }
  };
  useEffect(() => { load(); }, []);

  const handleQuickAdd = async (e) => {
    if (e.key !== "Enter" || !quick.trim()) return;
    try {
      await api.createTask({ title: quick.trim(), priority: "medium", status: "todo" });
      setQuick("");
      toast.success(lang === "fr" ? "Tâche ajoutée" : "Task added");
      load();
    } catch { toast.error("Error"); }
  };

  const toggleDone = async (task) => {
    try {
      const newStatus = task.status === "done" ? "todo" : "done";
      await api.updateTask(task.id, { status: newStatus });
      load();
    } catch { toast.error("Error"); }
  };

  const todayTasks = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date))).slice(0, 5);
  const openTasks = tasks.filter((t) => t.status !== "done").slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (lang === "fr") return h < 12 ? "Bonjour Cled" : h < 18 ? "Bon après-midi Cled" : "Bonsoir Cled";
    return h < 12 ? "Good morning, Cled" : h < 18 ? "Good afternoon, Cled" : "Good evening, Cled";
  };

  return (
    <div className="space-y-8 md:space-y-10" data-testid="dashboard-page">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-border"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(90,125,106,0.82), rgba(90,125,106,0.55)), url(https://images.unsplash.com/photo-1760278041762-7af48822d63a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="px-6 py-10 md:px-14 md:py-20 text-white">
          <div className="text-[11px] uppercase tracking-[0.25em] opacity-85">{format(new Date(), "EEEE, d MMMM")}</div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold mt-3 leading-tight italic">
            {greeting()} <span className="text-ochre not-italic">✿</span>
          </h1>
          <p className="mt-3 text-base max-w-xl opacity-90">
            {lang === "fr"
              ? "Votre journée en un coup d'œil. Tâches, sommeil, mouvement — tout est aligné."
              : "Your day at a glance. Tasks, sleep, movement — all aligned."}
          </p>

          <div className="mt-7 max-w-md">
            <Input
              data-testid="quick-add-input"
              placeholder={t("quick_add")}
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              onKeyDown={handleQuickAdd}
              className="bg-white/90 text-ink border-0 h-12 rounded-full px-5 font-body focus-visible:ring-2 focus-visible:ring-ochre"
            />
            <p className="text-xs mt-2 opacity-75">{t("press_enter")}</p>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 fade-stagger">
        <StatCard testId="stat-tasks" icon={CheckCircle} label={t("tasks")} value={`${stats?.tasks?.done ?? 0}/${stats?.tasks?.total ?? 0}`} subtitle={`${stats?.tasks?.completion_rate ?? 0}% ${t("completion_rate")}`} tone="sage" />
        <StatCard testId="stat-sleep" icon={Moon} label={t("avg_sleep")} value={`${stats?.sleep?.avg_hours_last_7 ?? 0}h`} subtitle={`${stats?.sleep?.entries_count ?? 0} ${lang === "fr" ? "nuits" : "nights"}`} tone="ochre" />
        <StatCard testId="stat-workouts" icon={Activity} label={t("weekly_workouts")} value={stats?.workouts?.week_count ?? 0} subtitle={`${stats?.workouts?.week_minutes ?? 0} ${t("minutes")}`} tone="terracotta" />
        <StatCard testId="stat-open" icon={Plus} label={t("in_progress")} value={stats?.tasks?.in_progress ?? 0} subtitle={`${stats?.tasks?.todo ?? 0} ${t("todo").toLowerCase()}`} tone="sage" />
      </section>

      {/* Today & Upcoming */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-organic p-6" data-testid="today-tasks-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-2xl font-medium">{t("today_tasks")}</h2>
            <span className="text-xs uppercase tracking-widest text-ink-muted">{format(new Date(), "dd MMM")}</span>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-ink-muted text-sm py-6">{t("empty_day")}</p>
          ) : (
            <ul className="space-y-3">
              {todayTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3">
                  <button
                    data-testid={`toggle-task-${task.id}`}
                    onClick={() => toggleDone(task)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === "done" ? "bg-sage border-sage" : "border-ink-muted hover:border-sage"
                    }`}
                  >
                    {task.status === "done" && <span className="text-white text-xs">✓</span>}
                  </button>
                  <span className={`flex-1 ${task.status === "done" ? "line-through text-ink-muted" : ""}`}>{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-organic p-6" data-testid="upcoming-tasks-card">
          <h2 className="font-heading text-2xl font-medium mb-5">{t("upcoming")}</h2>
          {openTasks.length === 0 ? (
            <p className="text-ink-muted text-sm py-6">{t("no_tasks")}</p>
          ) : (
            <ul className="space-y-3">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-1.5 h-6 rounded-full ${
                      task.priority === "high" ? "bg-terracotta" : task.priority === "medium" ? "bg-ochre" : "bg-sage"
                    }`} />
                    <span className="truncate">{task.title}</span>
                  </div>
                  {task.due_date && <span className="text-xs text-ink-muted shrink-0">{format(parseISO(task.due_date), "d MMM")}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
