import { useCallback, useEffect, useState } from "react";

export type WorkoutSession = {
  id: string;
  exercise: string;
  reps: number;
  date: string; // ISO
};

const STORAGE_KEY = "fitflex_history";

export default function useWorkoutHistory() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load workout history", e);
    }
  }, []);

  const save = useCallback((sessions: WorkoutSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save workout history", e);
    }
  }, []);

  const addSession = useCallback((session: Omit<WorkoutSession, "id" | "date"> & { date?: string }) => {
    const now = session.date ?? new Date().toISOString();
    const full = { ...session, id: `${Date.now()}`, date: now } as WorkoutSession;
    setHistory((prev) => {
      const next = [full, ...prev];
      save(next);
      return next;
    });
  }, [save]);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addSession, clear } as const;
}
