import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MediaPipeLiveTracker from "@/components/MediaPipeLiveTracker";
import useWorkoutHistory from "@/hooks/useWorkoutHistory";

export default function WorkoutSession(): JSX.Element {
  const navigate = useNavigate();
  const { addSession } = useWorkoutHistory();

  const [exercise, setExercise] = useState<string>("Bicep Curl");
  const [reps, setReps] = useState<number>(0);
  const [coachCue, setCoachCue] = useState<string>("");

  // fake hook: in real integration these would come from the tracker events
  useEffect(() => {
    const id = setInterval(() => {
      // demonstration: randomly show small cues
      if (Math.random() > 0.95) setCoachCue("Keep your elbow steady");
      if (Math.random() > 0.98) setCoachCue("Elbow up");
      if (Math.random() > 0.995) setCoachCue("");
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // coach cue auto-hide
  useEffect(() => {
    if (!coachCue) return;
    const t = setTimeout(() => setCoachCue(""), 1600);
    return () => clearTimeout(t);
  }, [coachCue]);

  const handleEnd = useCallback(() => {
    addSession({ exercise, reps });
    navigate("/");
  }, [addSession, exercise, reps, navigate]);

  const hud = useMemo(() => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white rounded-md p-3">
        <div className="text-sm text-gray-300">Exercise</div>
        <div className="text-lg font-semibold">{exercise}</div>
      </div>

      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white rounded-md p-3 text-center">
        <div className="text-sm text-gray-300">Reps</div>
        <div className="text-2xl font-bold">{reps}</div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div
          className={`transition-opacity duration-400 px-6 py-4 rounded-lg bg-black/60 backdrop-blur-md text-white text-xl font-semibold ${
            coachCue ? "opacity-100" : "opacity-0"
          }`}
        >
          {coachCue}
        </div>
      </div>
    </div>
  ), [exercise, reps, coachCue]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workout Session</h1>
        <div className="space-x-2">
          <select value={exercise} onChange={(e) => setExercise(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option>Bicep Curl</option>
            <option>Squat</option>
            <option>Shoulder Press</option>
          </select>
          <button onClick={() => setReps((r) => r + 1)} className="bg-emerald-600 px-3 py-2 rounded">+ Rep</button>
          <button onClick={handleEnd} className="bg-red-600 px-3 py-2 rounded">End Session</button>
        </div>
      </div>

      <div className="relative w-full max-w-3xl h-[480px] bg-black rounded overflow-hidden">
        <MediaPipeLiveTracker onRep={(n: number) => setReps(n)} />
        {hud}
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <div className="text-sm text-gray-400">Angle indicators</div>
        <div className="flex gap-4 mt-2">
          <div className="bg-gray-700 p-3 rounded w-40">
            <div className="text-xs text-gray-300">Elbow Angle</div>
            <div className="text-lg font-bold">45°</div>
          </div>
          <div className="bg-gray-700 p-3 rounded w-40">
            <div className="text-xs text-gray-300">Shoulder Angle</div>
            <div className="text-lg font-bold">12°</div>
          </div>
        </div>
      </div>
    </div>
  );
}
