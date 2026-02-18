import { useEffect, useRef } from "react";

interface Joint {
  x: number;
  y: number;
  z: number;
}

interface PoseVisualizerProps {
  isActive: boolean;
  formQuality: "good" | "bad" | "neutral";
}

// Simulated skeletal keypoints for bicep curl animation
const generatePose = (frame: number): Joint[] => {
  const t = Math.sin(frame * 0.03) * 0.5 + 0.5; // 0 to 1 cycle
  
  // 17 keypoints: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
  const baseY = 0.3;
  const shoulderY = baseY + 0.15;
  const elbowAngle = t * Math.PI * 0.7;
  
  return [
    { x: 0.5, y: baseY - 0.05, z: 0 }, // nose
    { x: 0.47, y: baseY - 0.07, z: 0 }, // left eye
    { x: 0.53, y: baseY - 0.07, z: 0 }, // right eye
    { x: 0.44, y: baseY - 0.05, z: 0 }, // left ear
    { x: 0.56, y: baseY - 0.05, z: 0 }, // right ear
    { x: 0.38, y: shoulderY, z: 0 }, // left shoulder
    { x: 0.62, y: shoulderY, z: 0 }, // right shoulder
    { x: 0.32, y: shoulderY + 0.15, z: 0 }, // left elbow
    { x: 0.62 + Math.sin(elbowAngle) * 0.06, y: shoulderY + 0.15 - Math.cos(elbowAngle) * 0.02, z: 0 }, // right elbow
    { x: 0.3, y: shoulderY + 0.28, z: 0 }, // left wrist
    { x: 0.62 + Math.sin(elbowAngle) * 0.12, y: shoulderY + 0.15 - Math.sin(elbowAngle) * 0.15, z: 0 }, // right wrist (curling)
    { x: 0.42, y: shoulderY + 0.3, z: 0 }, // left hip
    { x: 0.58, y: shoulderY + 0.3, z: 0 }, // right hip
    { x: 0.42, y: shoulderY + 0.55, z: 0 }, // left knee
    { x: 0.58, y: shoulderY + 0.55, z: 0 }, // right knee
    { x: 0.42, y: shoulderY + 0.75, z: 0 }, // left ankle
    { x: 0.58, y: shoulderY + 0.75, z: 0 }, // right ankle
  ];
};

const connections = [
  [0, 1], [0, 2], [1, 3], [2, 4], // face
  [5, 6], // shoulders
  [5, 7], [7, 9], // left arm
  [6, 8], [8, 10], // right arm
  [5, 11], [6, 12], // torso
  [11, 12], // hips
  [11, 13], [13, 15], // left leg
  [12, 14], [14, 16], // right leg
];

const PoseVisualizer = ({ isActive, formQuality }: PoseVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const qualityColor = {
    good: "hsl(145, 100%, 39%)",
    bad: "hsl(0, 100%, 50%)",
    neutral: "hsl(185, 100%, 50%)",
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 400;
    const h = 500;
    canvas.width = w;
    canvas.height = h;

    let animId: number;
    const color = qualityColor[formQuality];

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Scan line effect
      const scanY = (frameRef.current * 2) % h;
      ctx.fillStyle = `hsla(185, 100%, 50%, 0.03)`;
      ctx.fillRect(0, scanY, w, 2);

      if (isActive) {
        const joints = generatePose(frameRef.current);

        // Draw connections
        connections.forEach(([a, b]) => {
          const ja = joints[a];
          const jb = joints[b];
          ctx.beginPath();
          ctx.moveTo(ja.x * w, ja.y * h);
          ctx.lineTo(jb.x * w, jb.y * h);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Draw joints
        joints.forEach((j, i) => {
          ctx.beginPath();
          ctx.arc(j.x * w, j.y * h, i < 5 ? 3 : 5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Grid overlay
        ctx.strokeStyle = "hsla(185, 100%, 50%, 0.04)";
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      frameRef.current++;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [isActive, formQuality]);

  return (
    <div className="glass rounded-2xl p-1 glow-border-cyan relative overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-signal-red animate-pulse" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Live Feed
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ aspectRatio: "4/5", background: "hsl(220 30% 6% / 0.8)" }}
      />
      <div className="absolute bottom-3 left-3 right-3 flex justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">
          MediaPipe v0.10
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          30 FPS
        </span>
      </div>
    </div>
  );
};

export default PoseVisualizer;
