import { useEffect, useState } from "react";

interface HeroRepCounterProps {
  reps: number;
  isActive: boolean;
}

const HeroRepCounter = ({ reps, isActive }: HeroRepCounterProps) => {
  const [pulse, setPulse] = useState(false);
  const [prevReps, setPrevReps] = useState(reps);

  useEffect(() => {
    if (reps !== prevReps && reps > 0) {
      setPulse(true);
      setPrevReps(reps);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [reps, prevReps]);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <span className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
        Rep Count
      </span>
      <div
        className={`font-outfit font-black leading-none transition-all duration-200 ${
          pulse ? "animate-rep-pulse" : ""
        }`}
        style={{
          fontSize: "clamp(64px, 12vw, 128px)",
          color: "hsl(var(--neon-cyan))",
          textShadow: isActive
            ? "0 0 40px hsl(185 100% 50% / 0.6), 0 0 80px hsl(185 100% 50% / 0.2)"
            : "0 0 20px hsl(185 100% 50% / 0.3)",
        }}
      >
        {String(reps).padStart(2, "0")}
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isActive ? "bg-signal-green animate-pulse" : "bg-muted-foreground"
          }`}
        />
        <span className="text-xs font-mono text-muted-foreground">
          {isActive ? "TRACKING" : "STANDBY"}
        </span>
      </div>
    </div>
  );
};

export default HeroRepCounter;
