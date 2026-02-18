import { useEffect, useState } from "react";

interface CalibrationStatusProps {
  isCalibrated: boolean;
}

const CalibrationStatus = ({ isCalibrated }: CalibrationStatusProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (isCalibrated) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isCalibrated]);

  return (
    <div className={`glass rounded-xl px-4 py-3 flex items-center gap-3 ${
      isCalibrated ? "glow-border-green" : "glow-border-pink"
    }`}>
      <div className={`w-3 h-3 rounded-full ${
        isCalibrated ? "bg-signal-green" : "bg-neon-pink animate-pulse"
      }`} />
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {isCalibrated ? "System Ready" : `Calibrating${dots}`}
        </span>
        {isCalibrated && (
          <p className="text-[10px] font-mono text-signal-green mt-0.5">
            Pose model loaded • Kalman filter active
          </p>
        )}
      </div>
    </div>
  );
};

export default CalibrationStatus;
