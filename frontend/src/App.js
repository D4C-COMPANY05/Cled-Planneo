import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { I18nProvider } from "./i18n";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import SleepPage from "./pages/SleepPage";
import WorkoutPage from "./pages/WorkoutPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <I18nProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="sleep" element={<SleepPage />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </I18nProvider>
  );
}

export default App;
