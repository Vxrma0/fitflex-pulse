import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SAMPLE_CSV = `timestamp,ax,ay,az,gx,gy,gz
0,0.01,-0.98,0.02,0,0,0
50,0.15,-0.70,0.25,0.1,0,0
100,0.35,-0.30,0.55,0.2,0,0
150,0.50,0.10,0.70,0.15,0,0
200,0.35,-0.30,0.55,-0.1,0,0
250,0.10,-0.80,0.15,-0.2,0,0
300,0.01,-0.98,0.02,0,0,0
350,0.01,-0.98,0.02,0,0,0
400,0.14,-0.72,0.22,0.1,0,0
450,0.38,-0.25,0.58,0.2,0,0
500,0.52,0.12,0.72,0.15,0,0
550,0.30,-0.35,0.50,-0.1,0,0
600,0.08,-0.82,0.12,-0.2,0,0
650,0.01,-0.98,0.02,0,0,0`;

const BleSimulator = () => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const playingRef = useRef<number | null>(null);

  const playCsv = () => {
    const text = textareaRef.current?.value ?? "";
    if (!text) return;
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let start = 0;
    if (lines[0].toLowerCase().includes("timestamp")) start = 1;
    const rows = lines.slice(start).map((l) => l.split(",").map((c) => c.trim()));
    let i = 0;

    const push = () => {
      if (i >= rows.length) {
        if (playingRef.current) {
          clearInterval(playingRef.current);
          playingRef.current = null;
        }
        return;
      }
      const r = rows[i];
      const packet = {
        timestamp: parseInt(r[0], 10) || Date.now(),
        accel: { x: parseFloat(r[1]) || 0, y: parseFloat(r[2]) || 0, z: parseFloat(r[3]) || 0 },
        gyro: { x: parseFloat(r[4]) || 0, y: parseFloat(r[5]) || 0, z: parseFloat(r[6]) || 0 },
        battery: 85,
      };
      window.__BLE_SIMULATOR_PUSH?.(packet);
      i++;
    };

    playingRef.current = window.setInterval(push, 10);
  };

  const stop = () => {
    if (playingRef.current) {
      clearInterval(playingRef.current);
      playingRef.current = null;
    }
  };

  const loadSample = () => {
    if (textareaRef.current) {
      textareaRef.current.value = SAMPLE_CSV;
    }
  };

  return (
    <div className="glass rounded-2xl p-4 glow-border-purple">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          🔧 BLE Simulator
        </span>
        <Button variant="ghost" size="sm" onClick={loadSample} className="text-[10px] font-mono h-6 px-2">
          Load Sample
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        placeholder="Paste CSV telemetry: timestamp,ax,ay,az,gx,gy,gz"
        className="font-mono text-xs bg-muted/20 border-muted min-h-[100px] resize-y"
      />
      <div className="flex gap-2 mt-3">
        <Button onClick={playCsv} size="sm" className="text-xs font-mono bg-signal-green text-background hover:bg-signal-green/80">
          ▶ Play
        </Button>
        <Button onClick={stop} variant="outline" size="sm" className="text-xs font-mono">
          ⏹ Stop
        </Button>
      </div>
    </div>
  );
};

export default BleSimulator;
