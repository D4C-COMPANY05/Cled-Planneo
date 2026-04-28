// Thin async wrapper so pages can keep using the same `api.*` interface,
// but every call is served from localStorage — no backend required.
import { localdb } from "./localdb";

const wrap = (fn) => (...args) => Promise.resolve().then(() => fn(...args));

export const api = {
  // Tasks
  listTasks: wrap(() => localdb.tasks.list()),
  createTask: wrap((data) => localdb.tasks.create(data)),
  updateTask: wrap((id, data) => localdb.tasks.update(id, data)),
  deleteTask: wrap((id) => localdb.tasks.remove(id)),
  // Categories
  listCategories: wrap(() => localdb.categories.list()),
  createCategory: wrap((data) => localdb.categories.create(data)),
  deleteCategory: wrap((id) => localdb.categories.remove(id)),
  // Sleep
  listSleep: wrap(() => localdb.sleep.list()),
  createSleep: wrap((data) => localdb.sleep.create(data)),
  deleteSleep: wrap((id) => localdb.sleep.remove(id)),
  getSleepGoals: wrap(() => localdb.sleep.getGoals()),
  updateSleepGoals: wrap((data) => localdb.sleep.updateGoals(data)),
  getSleepStreak: wrap(() => localdb.sleep.getStreak()),
  // Workouts
  listWorkouts: wrap(() => localdb.workouts.list()),
  createWorkout: wrap((data) => localdb.workouts.create(data)),
  deleteWorkout: wrap((id) => localdb.workouts.remove(id)),
  listExercises: wrap(() => localdb.workouts.listExercises()),
  // Stats
  getStats: wrap(() => localdb.stats.compute()),
};
