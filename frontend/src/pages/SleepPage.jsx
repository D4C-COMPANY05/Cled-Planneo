import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { HalfMoon as Moon, Trash, Trophy, Settings } from "iconoir-react";

const meetsGoal = (duration, target) => duration >= target;

const SleepBar = ({ hours, target }) => {
  const pct = Math.min(100, Math.round((hours / target) * 100));
  const color = hours >= target ? "bg-sage" : hours >= target * 0.8 ? "bg-ochre" : "bg-terracotta";
  return (
    <div className="w-full bg-bone-alt rounded-full h-1.5 mt-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const SleepPage = () => {
  const { t, lang } = useI18n();
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(0);
  const [goal, setGoal] = useState({ target_hours: 8, target_bedtime: "23:00" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ target_hours: 8, target_bedtime: "23:00" });
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    bedtime: "23:00", wake_time: "07:00", quality: 3, notes: "",
  });

  const load = async () => {
    try {
      const [e, g, s] = await Promise.all([api.listSleep(), api.getSleepGoals(), api.getSleepStreak()]);
      setEntries(e);
      setGoal(g);
      setGoalDraft({ target_hours: g.target_hours, target_bedtime: g.target_bedtime });
      setStreak(s.streak);
    } catch { toast.error("Error"); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.createSleep(form);
      toast.success(lang === "fr" ? "Sommeil enregistré" : "Sleep logged");
      load();
    } catch { toast.error("Error"); }
  };

  const del = async (id) => { await api.deleteSleep(id); load(); };

  const saveGoal = async () => {
    try {
      await api.updateSleepGoals(goalDraft);
      toast.success(lang === "fr" ? "Objectif mis à jour" : "Goal updated");
      setShowGoalForm(false);
      load();
    } catch { toast.error("Error"); }
  };

  const StreakDisplay = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <span className="text-4xl">🔥</span>
        {streak === 0 && <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🔥</span>}
      </div>
      <div>
        <div className="font-heading text-3xl font-bold text-ink">
          {streak} <span className="text-lg font-normal text-ink-muted">{lang === "fr" ? "jour" + (streak > 1 ? "s" : "") : "day" + (streak !== 1 ? "s" : "")}</span>
        </div>
        <div className="text-xs text-ink-muted mt-0.5">
          {streak === 0
            ? (lang === "fr" ? "Atteignez votre objectif ce soir !" : "Hit your goal tonight!")
            : (lang === "fr" ? `Objectif ≥ ${goal.target_hours}h atteint` : `Goal ≥ ${goal.target_hours}h reached`)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-7" data-testid="sleep-page">
      <section
        className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-border"
        style={{
          backgroundImage: "linear-gradient(120deg, rgba(212,163,115,0.86), rgba(186,90,64,0.5)), url(https://images.unsplash.com/photo-1758273239813-cecda76c6c19?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80)",
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        <div className="px-6 py-10 md:px-12 md:py-16 text-white">
          <div className="text-[11px] uppercase tracking-[0.25em] opacity-90">{t("sleep")}</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-2 leading-tight italic">
            {lang === "fr" ? "Des nuits meilleures." : "Better nights."}
          </h1>
          <p className="mt-3 opacity-90 max-w-xl">
            {lang === "fr" ? "Enregistrez votre coucher et réveil. Suivez votre streak de nuits réussies." : "Log your bedtime and wake-up. Track your streak of successful nights."}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-organic p-6 flex flex-col gap-4" data-testid="streak-card">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-medium flex items-center gap-2">
              <Trophy className="w-5 h-5 text-ochre" /> Streak
            </h2>
          </div>
          <StreakDisplay />
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().slice(0, 10);
              const entry = entries.find((e) => e.date === key);
              const ok = entry && meetsGoal(entry.duration_hours, goal.target_hours);
              return (
                <div key={key} className="flex flex-col items-center gap-1 flex-1" title={key}>
                  <div className={`w-full h-8 rounded-lg transition-colors ${ok ? "bg-sage" : entry ? "bg-terracotta/40" : "bg-bone-alt"}`} />
                  <span className="text-[10px] text-ink-muted">{d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "narrow" })}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="card-organic p-6" data-testid="goal-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-medium">
              {lang === "fr" ? "Mon objectif" : "My goal"}
            </h2>
            <button onClick={() => setShowGoalForm((v) => !v)} className="p-1.5 text-ink-muted hover:text-sage" data-testid="toggle-goal-btn">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          {showGoalForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{lang === "fr" ? "Durée cible (heures)" : "Target duration (hours)"}</label>
                <Input type="number" min="4" max="12" step="0.5" value={goalDraft.target_hours}
                  onChange={(e) => setGoalDraft({ ...goalDraft, target_hours: parseFloat(e.target.value) })}
                  data-testid="goal-hours-input" />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === "fr" ? "Heure de coucher cible" : "Target bedtime"}</label>
                <Input type="time" value={goalDraft.target_bedtime}
                  onChange={(e) => setGoalDraft({ ...goalDraft, target_bedtime: e.target.value })}
                  data-testid="goal-bedtime-input" />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveGoal} className="btn-pill bg-sage hover:bg-sage-dark text-white flex-1" data-testid="save-goal-btn">{t("save")}</Button>
                <Button variant="outline" onClick={() => setShowGoalForm(false)} className="btn-pill">{t("cancel")}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted text-sm">{lang === "fr" ? "Durée cible" : "Target duration"}</span>
                <span className="font-heading text-2xl font-semibold text-sage">{goal.target_hours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted text-sm">{lang === "fr" ? "Coucher cible" : "Target bedtime"}</span>
                <span className="font-medium">{goal.target_bedtime}</span>
              </div>
              <p className="text-xs text-ink-muted mt-2">
                {lang === "fr" ? "Cliquez ⚙ pour modifier votre objectif." : "Click ⚙ to edit your goal."}
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-organic p-6" data-testid="sleep-form-card">
          <h2 className="font-heading text-2xl font-medium mb-5">{t("log_sleep")}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("date")}</label>
              <Input data-testid="sleep-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("bedtime")}</label>
                <Input data-testid="sleep-bedtime" type="time" value={form.bedtime} onChange={(e) => setForm({ ...form, bedtime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t("wake_time")}</label>
                <Input data-testid="sleep-wake" type="time" value={form.wake_time} onChange={(e) => setForm({ ...form, wake_time: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("quality")}</label>
              <div className="flex gap-2 mt-2" data-testid="sleep-quality-group">
                {[1,2,3,4,5].map((q) => (
                  <button key={q} data-testid={`quality-${q}-btn`} onClick={() => setForm({ ...form, quality: q })}
                    className={`w-10 h-10 rounded-full border transition-all duration-300 ${
                      form.quality === q ? "bg-ochre text-white border-ochre" : "bg-white border-border text-ink-muted hover:border-ochre"
                    }`}>{q}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("notes")}</label>
              <Input data-testid="sleep-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button data-testid="save-sleep-btn" onClick={save} className="btn-pill bg-ochre hover:bg-ochre-dark text-white w-full">
              <Moon className="w-4 h-4 mr-2" /> {t("save")}
            </Button>
          </div>
        </Card>

        <Card className="card-organic p-6" data-testid="sleep-history-card">
          <h2 className="font-heading text-2xl font-medium mb-5">{t("sleep_history")}</h2>
          {entries.length === 0 ? (
            <p className="text-ink-muted text-sm">{t("no_sleep_entries")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((s) => {
                const ok = meetsGoal(s.duration_hours, goal.target_hours);
                return (
                  <li key={s.id} className="py-3" data-testid={`sleep-entry-${s.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`font-heading text-2xl font-semibold min-w-[60px] ${ok ? "text-sage" : "text-terracotta"}`}>
                        {s.duration_hours}h {ok ? "✓" : ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{format(parseISO(s.date), "EEEE, d MMM")}</div>
                        <div className="text-xs text-ink-muted">{s.bedtime} → {s.wake_time} · {t("quality")} {s.quality}/5</div>
                        <SleepBar hours={s.duration_hours} target={goal.target_hours} />
                      </div>
                      <button data-testid={`delete-sleep-${s.id}`} onClick={() => del(s.id)} className="text-ink-muted hover:text-terracotta ml-2 shrink-0">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SleepPage;
