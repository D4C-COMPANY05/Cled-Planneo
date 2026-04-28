import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { HalfMoon as Moon, Activity, CheckSquare } from "iconoir-react";

const Section = ({ icon: Icon, color, title, children }) => {
  const tone = { sage: "text-sage", ochre: "text-[#8A6A3F]", terracotta: "text-terracotta" }[color];
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2 ${tone}`}>
        <Icon className="w-4 h-4" />
        <h3 className="font-heading text-sm uppercase tracking-widest font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
};
const Empty = ({ children }) => <p className="text-sm text-ink-muted py-1">{children}</p>;

const CalendarPage = () => {
  const { t, lang } = useI18n();
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [sleep, setSleep] = useState([]);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    (async () => {
      const [ts, sl, wk] = await Promise.all([api.listTasks(), api.listSleep(), api.listWorkouts()]);
      setTasks(ts); setSleep(sl); setWorkouts(wk);
    })();
  }, []);

  const sameDayStr = (isoOrDate) => {
    if (!isoOrDate) return false;
    try { return isSameDay(parseISO(isoOrDate), date); } catch { return false; }
  };

  const dayTasks = tasks.filter((x) => x.due_date && sameDayStr(x.due_date));
  const daySleep = sleep.filter((s) => isSameDay(parseISO(s.date), date));
  const dayWorkouts = workouts.filter((w) => isSameDay(parseISO(w.date), date));

  const taskDates = tasks.filter((tk) => tk.due_date).map((tk) => parseISO(tk.due_date));
  const sleepDates = sleep.map((s) => parseISO(s.date));
  const workoutDates = workouts.map((w) => parseISO(w.date));

  return (
    <div className="space-y-7" data-testid="calendar-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{t("calendar")}</div>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-1 italic">{t("calendar")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 lg:gap-8">
        <Card className="card-organic p-4 sm:p-6 w-full lg:w-fit" data-testid="calendar-widget">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            modifiers={{ hasTask: taskDates, hasSleep: sleepDates, hasWorkout: workoutDates }}
            modifiersClassNames={{
              hasTask: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-sage",
              hasSleep: "relative before:absolute before:bottom-1 before:left-[40%] before:-translate-x-1/2 before:w-1 before:h-1 before:rounded-full before:bg-ochre",
              hasWorkout: "relative data-[has-workout]:after:bg-terracotta",
            }}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sage"/>{t("tasks")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ochre"/>{t("sleep")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-terracotta"/>{t("workout")}</span>
          </div>
        </Card>

        <Card className="card-organic p-6" data-testid="day-details-card">
          <h2 className="font-heading text-2xl font-medium mb-1">{format(date, "EEEE, d MMMM yyyy")}</h2>
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-6">{t("events_on_day")}</p>
          <div className="space-y-6">
            <Section icon={CheckSquare} color="sage" title={t("tasks")}>
              {dayTasks.length === 0 ? <Empty>{lang === "fr" ? "Aucune tâche" : "No tasks"}</Empty> : (
                <ul className="space-y-2">
                  {dayTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3">
                      <span className={`w-1.5 h-5 rounded-full ${task.priority === "high" ? "bg-terracotta" : task.priority === "medium" ? "bg-ochre" : "bg-sage"}`} />
                      <span className={task.status === "done" ? "line-through text-ink-muted" : ""}>{task.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section icon={Moon} color="ochre" title={t("sleep")}>
              {daySleep.length === 0 ? <Empty>{lang === "fr" ? "Pas d'entrée" : "No entry"}</Empty> : (
                <ul className="space-y-2">
                  {daySleep.map((s) => (
                    <li key={s.id} className="text-sm text-ink-muted">
                      🌙 {s.bedtime} → ☀️ {s.wake_time} · <span className="text-ink font-medium">{s.duration_hours}h</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section icon={Activity} color="terracotta" title={t("workout")}>
              {dayWorkouts.length === 0 ? <Empty>{lang === "fr" ? "Pas de séance" : "No session"}</Empty> : (
                <ul className="space-y-2">
                  {dayWorkouts.map((w) => (
                    <li key={w.id} className="text-sm">
                      <div className="font-medium">{w.name} · {w.duration_minutes} {t("minutes")}</div>
                      <div className="text-xs text-ink-muted">{w.exercises.map((e) => e.name).join(", ")}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
