import ParticleEffects from "@/components/ParticleEffects";
import LiveTrackingPanel from "@/components/LiveTrackingPanel";
import BleSimulator from "@/components/BleSimulator";
import { Link } from "react-router-dom";

const LiveTracking = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleEffects />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-outfit font-bold neon-text-cyan">
              Live Tracking
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              BLE Band • Rep Detection • Session Capture
            </p>
          </div>
          <Link
            to="/"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors glass rounded-lg px-3 py-1.5"
          >
            ← Dashboard
          </Link>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <LiveTrackingPanel />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <BleSimulator />
            <div className="glass rounded-2xl p-4">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                📊 Session Log
              </span>
              <p className="text-xs font-mono text-muted-foreground mt-3">
                Complete a workout to see session summary here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
