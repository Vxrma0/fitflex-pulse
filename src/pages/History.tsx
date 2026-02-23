import React from "react";
import useWorkoutHistory from "@/hooks/useWorkoutHistory";

export default function History(): JSX.Element {
  const { history, clear } = useWorkoutHistory();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">History</h1>
        <button onClick={clear} className="bg-red-600 px-3 py-2 rounded">Clear</button>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
              <th className="py-2">Date</th>
              <th>Exercise</th>
              <th>Reps</th>
            </tr>
          </thead>
          <tbody>
            {history.map((s) => (
              <tr key={s.id} className="border-b border-gray-700">
                <td className="py-3">{new Date(s.date).toLocaleString()}</td>
                <td>{s.exercise}</td>
                <td>{s.reps}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-400">No sessions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
