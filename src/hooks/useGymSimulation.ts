import { useState, useEffect, useCallback, useRef } from "react";

interface RepEntry {
  id: number;
  timestamp: string;
  formScore: number;
  tempo: string;
  feedback: string;
  quality: "good" | "bad";
}

interface FeedbackState {
  message: string;
  type: "good" | "bad" | "neutral";
  visible: boolean;
}

export const useGymSimulation = () => {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [tempoScore, setTempoScore] = useState(0);
  const [detectionQuality, setDetectionQuality] = useState(0);
  const [formQuality, setFormQuality] = useState<"good" | "bad" | "neutral">("neutral");
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: "",
    type: "neutral",
    visible: false,
  });
  const [repLog, setRepLog] = useState<RepEntry[]>([]);
  const [exerciseState, setExerciseState] = useState<string>("Ready");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calibration phase
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalibrated(true);
      setIsActive(true);
      setDetectionQuality(92);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const showFeedback = useCallback((msg: string, type: "good" | "bad" | "neutral") => {
    setFeedback({ message: msg, type, visible: true });
    setTimeout(() => setFeedback((f) => ({ ...f, visible: false })), 2500);
  }, []);

  // Simulate rep cycle
  useEffect(() => {
    if (!isActive) return;

    const states = ["Ready", "Descending", "Bottom", "Ascending", "Top"];
    let stateIdx = 0;

    intervalRef.current = setInterval(() => {
      stateIdx = (stateIdx + 1) % states.length;
      setExerciseState(states[stateIdx]);

      // Fluctuate detection quality
      setDetectionQuality((prev) => Math.min(99, Math.max(75, prev + (Math.random() - 0.45) * 5)));

      if (states[stateIdx] === "Top") {
        // Complete a rep
        const isGood = Math.random() > 0.25;
        const score = isGood
          ? Math.floor(Math.random() * 15 + 85)
          : Math.floor(Math.random() * 30 + 40);
        const tempo = isGood
          ? Math.floor(Math.random() * 15 + 80)
          : Math.floor(Math.random() * 30 + 30);

        setFormScore(score);
        setTempoScore(tempo);
        setFormQuality(isGood ? "good" : "bad");

        if (isGood) {
          setReps((r) => r + 1);
          const msgs = ["Perfect Form! 🔥", "Great ROM! 💪", "Smooth Rep!", "Textbook Form! ✅"];
          showFeedback(msgs[Math.floor(Math.random() * msgs.length)], "good");
        } else {
          const msgs = ["⚠️ Too Fast!", "Half Rep Detected", "⚠️ Swinging!", "Slow Down!"];
          showFeedback(msgs[Math.floor(Math.random() * msgs.length)], "bad");
        }

        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        const quality: "good" | "bad" = isGood ? "good" : "bad";
        setRepLog((log) => [
          {
            id: Date.now(),
            timestamp,
            formScore: score,
            tempo: `${(Math.random() * 2 + 1.5).toFixed(1)}s`,
            feedback: isGood ? "Perfect" : "Form Error",
            quality,
          },
          ...log,
        ].slice(0, 20));
      }
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, showFeedback]);

  return {
    isCalibrated,
    isActive,
    reps,
    formScore,
    tempoScore,
    detectionQuality,
    formQuality,
    feedback,
    repLog,
    exerciseState,
  };
};
