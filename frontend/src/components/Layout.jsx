import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "@/i18n";
import { Calendar, Home, CheckSquare, HalfMoon as Moon, Activity, StatsReport as BarChart3, Language as Languages } from "iconoir-react";
import { Button } from "@/components/ui/button";

const Brand = ({ size = "base" }) => {
  const sizes = {
    base: "text-xl",
    lg: "text-2xl md:text-3xl",
  };
  return (
    <div className="flex items-baseline gap-2" data-testid="app-brand">
      <span className={`font-heading ${sizes[size]} font-semibold text-ink italic`}>
        Cled&apos;s
      </span>
      <span className={`font-heading ${sizes[size]} font-semibold text-ink`}>
        Planné<span className="text-terracotta">o</span>
      </span>
    </div>
  );
};

const NavItem = ({ to, icon: Icon, label, testId }) => (
  <NavLink
    to={to}
    end={to === "/"}
    data-testid={testId}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all duration-300 ${
        isActive ? "nav-item-active" : "text-ink-muted hover:bg-bone-alt hover:text-ink"
      }`
    }
  >
    <Icon className="w-[18px] h-[18px]" />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Layout = () => {
  const { t, lang, setLang } = useI18n();

  const mobileTabs = [
    { to: "/", icon: Home, testId: "nav-dashboard-mobile", label: t("dashboard") },
    { to: "/tasks", icon: CheckSquare, testId: "nav-tasks-mobile", label: t("tasks") },
    { to: "/calendar", icon: Calendar, testId: "nav-calendar-mobile", label: t("calendar") },
    { to: "/sleep", icon: Moon, testId: "nav-sleep-mobile", label: t("sleep") },
    { to: "/workout", icon: Activity, testId: "nav-workout-mobile", label: t("workout") },
    { to: "/stats", icon: BarChart3, testId: "nav-stats-mobile", label: t("stats") },
  ];

  return (
    <div className="min-h-screen bg-bone flex" data-testid="app-layout">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-[#FDFCFB] px-5 py-8 sticky top-0 h-screen">
        <div className="mb-10">
          <Brand size="lg" />
          <p className="text-xs mt-1 text-ink-muted tracking-wide">{t("tagline")}</p>
        </div>

        <nav className="flex flex-col gap-1.5 fade-stagger">
          <NavItem to="/" icon={Home} label={t("dashboard")} testId="nav-dashboard" />
          <NavItem to="/tasks" icon={CheckSquare} label={t("tasks")} testId="nav-tasks" />
          <NavItem to="/calendar" icon={Calendar} label={t("calendar")} testId="nav-calendar" />
          <NavItem to="/sleep" icon={Moon} label={t("sleep")} testId="nav-sleep" />
          <NavItem to="/workout" icon={Activity} label={t("workout")} testId="nav-workout" />
          <NavItem to="/stats" icon={BarChart3} label={t("stats")} testId="nav-stats" />
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
            <Languages className="w-4 h-4" /> {t("language")}
          </div>
          <div className="flex gap-2" data-testid="language-toggle">
            <Button
              data-testid="lang-fr-btn"
              variant={lang === "fr" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("fr")}
              className={`btn-pill flex-1 ${lang === "fr" ? "bg-sage hover:bg-sage-dark text-white" : ""}`}
            >FR</Button>
            <Button
              data-testid="lang-en-btn"
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("en")}
              className={`btn-pill flex-1 ${lang === "en" ? "bg-sage hover:bg-sage-dark text-white" : ""}`}
            >EN</Button>
          </div>
          <p className="text-[10px] text-ink-muted mt-4 leading-relaxed">
            {lang === "fr" ? "100% local · vos données restent sur cet appareil." : "100% local · your data stays on this device."}
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#FDFCFB]/95 backdrop-blur border-b border-border px-4 py-3 flex justify-between items-center safe-top">
        <Brand size="base" />
        <div className="flex gap-1">
          <Button data-testid="lang-fr-btn-mobile" size="sm" variant={lang === "fr" ? "default" : "outline"} onClick={() => setLang("fr")} className={`btn-pill ${lang === "fr" ? "bg-sage text-white hover:bg-sage-dark" : ""}`}>FR</Button>
          <Button data-testid="lang-en-btn-mobile" size="sm" variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")} className={`btn-pill ${lang === "en" ? "bg-sage text-white hover:bg-sage-dark" : ""}`}>EN</Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 relative">
        <div className="px-4 sm:px-8 py-6 md:py-12 max-w-7xl mx-auto pb-32 md:pb-12 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav style={{ zIndex: 99999 }} className="md:hidden fixed bottom-0 inset-x-0 bg-[#FDFCFB]/95 backdrop-blur border-t border-border px-1.5 pt-1.5 pb-1.5 safe-bottom">
        <div className="flex items-center justify-between gap-0.5">
          {mobileTabs.map(({ to, icon: Icon, testId, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              data-testid={testId}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors duration-200 ${
                  isActive ? "bg-sage/15 text-sage" : "text-ink-muted active:bg-bone-alt"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
