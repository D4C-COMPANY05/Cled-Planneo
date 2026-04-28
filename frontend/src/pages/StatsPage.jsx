import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = { sage: "#5A7D6A", terracotta: "#D26A4D", ochre: "#D4A373", sageLight: "#7B9E87" };

const MiniStat = ({ label, value, accent = "ink", testId }) => {
  const tone = { sage: "text-sage", ochre: "text-[#8A6A3F]", terracotta: "text-terracotta", ink: "text-ink" }[accent];
  return (
    <Card className="card-organic p-5 sm:p-6" data-testid={testId}>
      <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{label}</div>
      <div className={`font-heading text-3xl sm:text-4xl font-semibold mt-2 ${tone}`}>{value}</div>
    </Card>
  );
};

const StatsPage = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => setStats(await api.getStats()))();
  }, []);

  if (!stats) {
    return <div className="text-ink-muted" data-testid="stats-loading">Loading…</div>;
  }

  const statusData = [
    { name: t("todo"), value: stats.tasks.todo, color: COLORS.sageLight },
    { name: t("in_progress"), value: stats.tasks.in_progress, color: COLORS.ochre },
    { name: t("done"), value: stats.tasks.done, color: COLORS.sage },
  ].filter((d) => d.value > 0);

  const dailyData = stats.daily_activity.map((d) => ({ ...d, label: format(parseISO(d.date), "EEE") }));
  const sleepData = [...stats.sleep.last_7_days].reverse().map((s) => ({ label: format(parseISO(s.date), "EEE d"), hours: s.duration_hours }));

  return (
    <div className="space-y-7" data-testid="stats-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-muted font-medium">{t("stats")}</div>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-1 italic">{t("stats")}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 fade-stagger">
        <MiniStat testId="mini-total" label={t("total")} value={stats.tasks.total} />
        <MiniStat testId="mini-completed" label={t("completed")} value={stats.tasks.done} accent="sage" />
        <MiniStat testId="mini-completion" label={t("completion_rate")} value={`${stats.tasks.completion_rate}%`} accent="ochre" />
        <MiniStat testId="mini-avg-sleep" label={t("avg_sleep")} value={`${stats.sleep.avg_hours_last_7}h`} accent="terracotta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-organic p-6" data-testid="chart-productivity">
          <h2 className="font-heading text-xl font-medium mb-4">{t("productivity_7days")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" />
                <XAxis dataKey="label" stroke="#747875" tick={{ fontSize: 12 }} />
                <YAxis stroke="#747875" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E8E4D9", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="created" name={t("created")} fill={COLORS.ochre} radius={[8,8,0,0]} />
                <Bar dataKey="completed" name={t("completed")} fill={COLORS.sage} radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-organic p-6" data-testid="chart-status">
          <h2 className="font-heading text-xl font-medium mb-4">{t("tasks_by_status")}</h2>
          <div className="h-72">
            {statusData.length === 0 ? (
              <div className="h-full grid place-items-center text-ink-muted text-sm">{t("no_tasks")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E8E4D9", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="card-organic p-6 lg:col-span-2" data-testid="chart-sleep">
          <h2 className="font-heading text-xl font-medium mb-4">{t("sleep_last_7")}</h2>
          <div className="h-72">
            {sleepData.length === 0 ? (
              <div className="h-full grid place-items-center text-ink-muted text-sm">{t("no_sleep_entries")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" />
                  <XAxis dataKey="label" stroke="#747875" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#747875" tick={{ fontSize: 12 }} domain={[0, 12]} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E8E4D9", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="hours" stroke={COLORS.terracotta} strokeWidth={3} dot={{ r: 5, fill: COLORS.terracotta }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
