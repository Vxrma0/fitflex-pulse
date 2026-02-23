import ParticleEffects from "@/components/ParticleEffects";
import HeroRepCounter from "@/components/HeroRepCounter";
import MetricCard from "@/components/MetricCard";
import FeedbackBanner from "@/components/FeedbackBanner";
import PoseVisualizer from "@/components/PoseVisualizer";
import MediaPipeLiveTracker from "@/components/MediaPipeLiveTracker";
import CalibrationStatus from "@/components/CalibrationStatus";
import RepLog from "@/components/RepLog";
import { useGymSimulation } from "@/hooks/useGymSimulation";
import { Link } from "react-router-dom";
import fitflexLogo from "@assets/fitflex-logo.png";

const Index = () => {
  const {
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
  } = useGymSimulation();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleEffects />
      <FeedbackBanner
        message={feedback.message}
        type={feedback.type}
        visible={feedback.visible}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img 
              src={fitflexLogo} 
              alt="FitFlex Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-outfit font-bold neon-text-pink">
                FitFlex Ultra
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                AI Smart Gym • Prototype v1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/live"
              className="glass rounded-lg px-3 py-1.5 text-xs font-mono neon-text-cyan hover:bg-muted/30 transition-colors"
            >
              ⚡ Live Tracking
            </Link>
            <div className="glass rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">
                Exercise:{" "}
              </span>
              <span className="text-xs font-mono neon-text-cyan">
                Bicep Curl
              </span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">
                State:{" "}
              </span>
              <span className="text-xs font-mono neon-text-purple">
                {exerciseState}
              </span>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Camera Pose Tracker (replaces exoskeleton) */}
          <div className="lg:col-span-4">
            <MediaPipeLiveTracker exercise="Bicep Curl" />
            <div className="mt-4">
              <CalibrationStatus isCalibrated={isCalibrated} />
            </div>
          </div>

          {/* Center: Hero Rep Counter */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="glass-strong rounded-3xl p-8 w-full flex flex-col items-center glow-border-cyan">
              <HeroRepCounter reps={reps} isActive={isActive} />
              <div className="mt-6 w-full grid grid-cols-5 gap-1">
                {["Ready", "Descending", "Bottom", "Ascending", "Top"].map(
                  (state) => (
                    <div
                      key={state}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        exerciseState === state
                          ? "bg-neon-cyan"
                          : "bg-muted"
                      }`}
                    />
                  )
                )}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-widest">
                5-Stage State Machine
              </p>
            </div>
          </div>

          {/* Right: Metrics */}
          <div className="lg:col-span-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Form Score"
                value={formScore}
                unit="%"
                color="green"
                icon="🎯"
              />
              <MetricCard
                label="Tempo"
                value={tempoScore}
                unit="%"
                color="cyan"
                icon="⏱️"
              />
              <MetricCard
                label="Detection"
                value={Math.round(detectionQuality)}
                unit="%"
                color="purple"
                icon="📷"
              />
              <MetricCard
                label="Total Reps"
                value={reps}
                color="pink"
                icon="🔥"
              />
            </div>
            <RepLog entries={repLog} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">
            Powered by MediaPipe Pose • Kalman Filter Stabilization • Green/Red
            Database Classification
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            Optimized for Raspberry Pi 4 + Webcam • Indian Market Ready 🇮🇳
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
