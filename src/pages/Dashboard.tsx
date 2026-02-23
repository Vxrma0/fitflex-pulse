import React, { useMemo } from "react";
import useWorkoutHistory from "@/hooks/useWorkoutHistory";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function Dashboard(): JSX.Element {
  const { history } = useWorkoutHistory();

  const stats = useMemo(() => {
    const totalWorkouts = history.length;
    const totalReps = history.reduce((s, h) => s + h.reps, 0);
    const fav = history.reduce((map: Record<string, number>, h) => {
      map[h.exercise] = (map[h.exercise] || 0) + h.reps;
      return map;
    }, {} as Record<string, number>);
    const favoriteExercise = Object.entries(fav).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { totalWorkouts, totalReps, favoriteExercise };
  }, [history]);

  const chartData = useMemo(() => {
    const days = lastNDays(7);
    const map = days.reduce((acc: Record<string, number>, d) => {
      acc[d] = 0;
      return acc;
    }, {} as Record<string, number>);

    history.forEach((s) => {
      const key = s.date.slice(0, 10);
      if (key in map) map[key] += s.reps;
    });

    return days.map((d) => ({ date: d.slice(5), reps: map[d] }));
  }, [history]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Workouts</div>
          <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Favorite Exercise</div>
          <div className="text-2xl font-bold">{stats.favoriteExercise}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Reps</div>
          <div className="text-2xl font-bold">{stats.totalReps}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg h-64">
        <div className="text-sm text-gray-400 mb-2">Reps per Day (last 7 days)</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
            <XAxis dataKey="date" tick={{ fill: "#9ca3af" }} />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip />
            <Line type="monotone" dataKey="reps" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
