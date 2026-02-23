import { useEffect, useState } from "react";
import { useBle } from "@/hooks/useBle";
import { RepDetector } from "@/lib/repDetector";
import { uploadSession } from "@/services/sessionService";
import fitflexLogo from "@/assets/fitflex-logo.png";

const LiveTrackingPanel = () => {
  const { deviceName, batteryPercent, lastPacket, connectionState, startScan, disconnect } = useBle();
  const [detector] = useState(() => new RepDetector());
  const [repCount, setRepCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [detectorState, setDetectorState] = useState("idle");
  const [exercise] = useState("Bicep Curl");
  const [weightKg, setWeightKg] = useState(12.5);
  const [inSession, setInSession] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  const repsPerSet = 12;
  const progress = Math.min(repCount / repsPerSet, 1);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    return detector.onChange((s) => {
      setRepCount(s.repCount);
      setSetCount(s.setCount);
      setDetectorState(s.state);
    });
  }, [detector]);

  useEffect(() => {
    if (!lastPacket) return;
    const ts = lastPacket.timestamp ?? Date.now();
    const ax = lastPacket.accel?.x ?? 0;
    const ay = lastPacket.accel?.y ?? 0;
    const az = lastPacket.accel?.z ?? 0;
    detector.pushSample(ts, ax, ay, az);
  }, [lastPacket, detector]);

  const startWorkout = () => {
    detector.reset();
    setRepCount(0);
    setSetCount(0);
    setInSession(true);
    setSessionStart(Date.now());
  };

  const endWorkout = async () => {
    if (!inSession || sessionStart == null) return;
    await uploadSession({
      startTime: sessionStart,
      endTime: Date.now(),
      exercises: [{
        name: exercise,
        sets: [{ setNumber: setCount + 1, reps: repCount, weightKg, durationMs: Date.now() - sessionStart }],
        totalVolumeKg: repCount * weightKg,
      }],
      summaryMetrics: { totalReps: repCount, totalSets: setCount || 1, totalVolumeKg: repCount * weightKg },
      device: { deviceName, batteryPercent },
    });
    setInSession(false);
    setSessionStart(null);
  };

  const connDot = connectionState === "connected" ? "bg-signal-green shadow-[0_0_6px_hsl(var(--signal-green)/0.5)]" : "bg-muted-foreground";

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col gap-5 glow-border-cyan">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={fitflexLogo} alt="FitFlex" className="w-11 h-11 object-contain" />
          <div>
            <p className="text-sm font-outfit font-semibold text-foreground">{exercise}</p>
            <p className="text-[11px] font-mono text-muted-foreground">Single-arm isolation • Dumbbell</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${connDot}`} />
          <span className="text-xs font-mono text-muted-foreground capitalize">{connectionState}</span>
        </div>
      </div>

      {/* Ring + Counter */}
      <div className="flex justify-center py-4">
        <div className="relative w-56 h-56">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="hsl(var(--neon-cyan))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-outfit font-black text-6xl neon-text-cyan">
              {String(repCount).padStart(2, "0")}
            </span>
            <span className="text-sm font-mono text-muted-foreground mt-1">Set {setCount + 1}</span>
          </div>
        </div>
      </div>

      {/* State indicator */}
      <div className="flex justify-center">
        <div className="glass rounded-lg px-3 py-1">
          <span className="text-[10px] font-mono text-muted-foreground">State: </span>
          <span className="text-xs font-mono neon-text-purple uppercase">{detectorState}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Weight</span>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(parseFloat(e.target.value || "0"))}
            step="0.5"
            min="0"
            className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          />
          <span className="text-xs font-mono text-muted-foreground">kg</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={connectionState === "connected" ? disconnect : startScan}
            className="h-8 px-3 rounded-md text-xs font-mono border border-input bg-muted/30 text-foreground hover:bg-muted/50 transition-colors"
          >
            {connectionState === "connected" ? "Disconnect" : "Scan Band"}
          </button>
          {!inSession ? (
            <button
              onClick={startWorkout}
              className="h-8 px-4 rounded-md text-xs font-mono font-bold bg-signal-green text-background hover:bg-signal-green/80 transition-colors"
            >
              Start Workout
            </button>
          ) : (
            <button
              onClick={endWorkout}
              className="h-8 px-4 rounded-md text-xs font-mono font-bold bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
            >
              End Workout
            </button>
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground border-t border-border pt-3">
        <span>{deviceName || "No band paired"}</span>
        <span>Battery: {batteryPercent}%</span>
      </div>
    </div>
  );
};

export default LiveTrackingPanel;
