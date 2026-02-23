import React, { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { smoothPose, Joint } from "../lib/poseSmoothing";
import { RepDetectorPose } from "../lib/repDetectorPose";
import { uploadSession } from "../services/sessionService";
import ConsentModal from "./ConsentModal";
import "../styles/mediapipe-tracker.css";

// Minimal multi-exercise detector (simplified port of improved_multi_exercise)
class MultiExerciseDetector {
  detectors: Record<string, RepDetectorPose>;
  current: string;
  history: any[];
  lastSwitchTs: number;

  constructor() {
    this.detectors = {
      bicep_curl: new RepDetectorPose({ exercise: "Bicep Curl" }),
      squat: new RepDetectorPose({ exercise: "Squat" }),
      deadlift: new RepDetectorPose({ exercise: "Deadlift" }),
      shoulder_press: new RepDetectorPose({ exercise: "Shoulder Press" }),
    } as Record<string, RepDetectorPose>;
    this.current = "bicep_curl";
    this.history = [];
    this.lastSwitchTs = 0;
  }

  reset_all() {
    Object.values(this.detectors).forEach((d) => d.reset());
  }

  start_calibration(exercise?: string) {
    if (exercise) this.detectors[exercise].calibrate();
    else Object.values(this.detectors).forEach((d) => d.calibrate());
  }

  analyze_and_switch(joints: Joint[]) {
    // compute simple signatures
    const vis = joints.map((j) => j.visibility ?? 0);
    const safe = (i: number) => (i >= 0 && i < joints.length ? [joints[i].x, joints[i].y] : [0, 0]);

    const leftW = safe(15), rightW = safe(16);
    const leftS = safe(11), rightS = safe(12);
    let wrist_disp = 0;
    if (vis[15] > 0.3 && vis[11] > 0.3) wrist_disp += Math.abs(leftW[1] - leftS[1]);
    if (vis[16] > 0.3 && vis[12] > 0.3) wrist_disp += Math.abs(rightW[1] - rightS[1]);

    // knee angles
    const angle = (A: number, B: number, C: number) => {
      const a = safe(A), b = safe(B), c = safe(C);
      const v1 = [a[0] - b[0], a[1] - b[1]];
      const v2 = [c[0] - b[0], c[1] - b[1]];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const m1 = Math.hypot(v1[0], v1[1]);
      const m2 = Math.hypot(v2[0], v2[1]);
      if (m1 * m2 === 0) return 0;
      const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
      return (Math.acos(cos) * 180) / Math.PI;
    };

    const left_knee = angle(23, 25, 27);
    const right_knee = angle(24, 26, 28);
    const knee_avg = left_knee && right_knee ? (left_knee + right_knee) / 2 : Math.max(left_knee, right_knee);

    const left_hip = angle(11, 23, 25);
    const right_hip = angle(12, 24, 26);
    const hip_avg = left_hip && right_hip ? (left_hip + right_hip) / 2 : Math.max(left_hip, right_hip);

    const torso_disp = Math.abs(joints[11]?.y - joints[12]?.y || 0);

    const scores: Record<string, number> = {
      bicep_curl: wrist_disp,
      squat: Math.max(0, 180 - (knee_avg || 0)),
      deadlift: Math.max(0, 180 - (hip_avg || 0)) * (torso_disp < 40 ? 1.0 : 0.6),
      shoulder_press: wrist_disp * 0.8,
    };

    const chosen = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const now = Date.now() / 1000;
    if (chosen !== this.current && now - this.lastSwitchTs > 1.0) {
      if (scores[chosen] > (scores[this.current] || 0) * 1.2 + 1.0) {
        this.current = chosen;
        this.lastSwitchTs = now;
      }
    }
    return this.current;
  }

  update_for_exercise(ex: string, angleVal: number) {
    const det = this.detectors[ex];
    // reuse RepDetectorPose logic by faking updateFromPose with an angle wrapper
    // We'll call updateFromPose with a minimal joint array if needed; instead, call det.updateFromPose expecting joints
    // For simplicity, convert angle to a fake joints array where elbow angle computed inside detector will match angleVal is non-trivial.
    // So we'll use the existing RepDetectorPose for basic counting via its internal logic when available.
    // For now, use det.updateFromPose with an empty array and rely on earlier single-exercise detector in this component.
    return det.updateFromPose([] as any);
  }
}

type TrackerProps = {
  exercise?: "Bicep Curl" | "Squat" | "Shoulder Press";
  onRep?: (n: number) => void;
};

export default function MediaPipeLiveTracker({ exercise = "Bicep Curl", onRep }: TrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(() => {
    try {
      return localStorage.getItem("fitflex_consent") === "true";
    } catch {
      return false;
    }
  });

  const repDetectorRef = useRef<RepDetectorPose | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [inSession, setInSession] = useState(false);
  const [weightKg, setWeightKg] = useState<number>(12.5);
  const sessionStartRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // notify parent when rep count changes
  useEffect(() => {
    try {
      if (onRep) onRep(repCount);
    } catch {}
  }, [repCount, onRep]);

  useEffect(() => {
    // keyboard controls
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'c') {
        // calibrate all
        try { (repDetectorRef as any).multi?.start_calibration(); } catch {}
        repDetectorRef.current?.calibrate();
        console.log('Calibration triggered');
      } else if (k === 'r') {
        repDetectorRef.current?.reset();
        try { (repDetectorRef as any).multi?.reset_all(); } catch {}
        setRepCount(0);
        setSetCount(0);
        console.log('Reset counts');
      } else if (k === 's') {
        // save session summary
        (async () => {
          if (!sessionStartRef.current) return;
          const summary = { start: sessionStartRef.current, end: Date.now(), reps: repCount, sets: setCount };
          await uploadSession(summary);
          console.log('Session saved', summary);
        })();
      } else if (k === 'q') {
        // stop camera
        cameraRef.current?.stop();
        console.log('Camera stopped');
      }
    };
    window.addEventListener('keydown', onKey);
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: false,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    // initialize rep detector (RepDetectorPose used as single-exercise fallback)
    repDetectorRef.current = new RepDetectorPose({ exercise });

    let localStream: MediaStream | null = null;
    let rafId: number | null = null;

    async function startNativeCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("getUserMedia not supported in this browser");
          return;
        }
        localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
        }
        setCameraReady(true);

        const loop = async () => {
          try {
            if (poseRef.current && videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              await poseRef.current.send({ image: videoRef.current });
            }
          } catch (e) {
            console.warn('frame send error', e);
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.warn('Camera start failed', err);
      }
    }

    // start native camera
    startNativeCamera();

    return () => {
      // stop raf
      try { if ((window as any).cancelAnimationFrame) { /* cancel by id if set */ } } catch {}
      if (rafId) cancelAnimationFrame(rafId);
      // stop media tracks
      try {
        if (localStream) {
          localStream.getTracks().forEach((t) => t.stop());
        }
      } catch {}
      poseRef.current?.close();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  async function onResults(results: Results) {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth || 640;
    canvasRef.current.height = videoRef.current.videoHeight || 480;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (!results.poseLandmarks) return;

    const joints: Joint[] = results.poseLandmarks.map((lm) => ({
      x: lm.x * canvasRef.current!.width,
      y: lm.y * canvasRef.current!.height,
      z: lm.z,
      visibility: lm.visibility ?? 1,
    }));

    try {
      const smoothed = smoothPose(joints);

      // initialize a lightweight multi-detector on first frame
      if (!((repDetectorRef as any).multi) as boolean) {
        (repDetectorRef as any).multi = new (MultiExerciseDetector as any)();
      }
      const multi: MultiExerciseDetector = (repDetectorRef as any).multi;

      // auto-switch exercise
      const current = multi.analyze_and_switch(smoothed);

      // compute primary angle per current exercise (simple selection)
      const angleForExercise = () => {
        const vis = smoothed.map((s) => s.visibility ?? 0);
        const idx = (name: string) => (Pose as any).PoseLandmark[name].value;
        try {
          if (current === "bicep_curl" || current === "shoulder_press") {
            const leftVis = (vis[idx("LEFT_SHOULDER")] || 0) + (vis[idx("LEFT_ELBOW")] || 0) + (vis[idx("LEFT_WRIST")] || 0);
            const rightVis = (vis[idx("RIGHT_SHOULDER")] || 0) + (vis[idx("RIGHT_ELBOW")] || 0) + (vis[idx("RIGHT_WRIST")] || 0);
            const side = rightVis > leftVis ? "RIGHT" : "LEFT";
            const s = idx(`${side}_SHOULDER`);
            const e = idx(`${side}_ELBOW`);
            const widx = idx(`${side}_WRIST`);
            return angleDeg(smoothed[s], smoothed[e], smoothed[widx]);
          }
          if (current === "squat") {
            const left = angleDeg(smoothed[idx("LEFT_HIP")], smoothed[idx("LEFT_KNEE")], smoothed[idx("LEFT_ANKLE")]);
            const right = angleDeg(smoothed[idx("RIGHT_HIP")], smoothed[idx("RIGHT_KNEE")], smoothed[idx("RIGHT_ANKLE")]);
            return left && right ? (left + right) / 2 : Math.max(left, right);
          }
          if (current === "deadlift") {
            const left = angleDeg(smoothed[idx("LEFT_SHOULDER")], smoothed[idx("LEFT_HIP")], smoothed[idx("LEFT_KNEE")]);
            const right = angleDeg(smoothed[idx("RIGHT_SHOULDER")], smoothed[idx("RIGHT_HIP")], smoothed[idx("RIGHT_KNEE")]);
            return left && right ? (left + right) / 2 : Math.max(left, right);
          }
        } catch (e) {
          return 0;
        }
        return 0;
      };

      const angleVal = angleForExercise();

      // update fallback detector (keeps repCount/setCount in sync)
      const repDetector = repDetectorRef.current!;
      // If using RepDetectorPose we can call updateFromPose(smoothed)
      const update = repDetector.updateFromPose(smoothed);
      if (update.repIncrement) setRepCount((r) => r + 1);
      if (update.setIncrement) setSetCount((s) => s + 1);
      setRepCount(repDetector.repCount);
      setSetCount(repDetector.setCount);

      // draw aesthetic neon overlay instead of original exoskeleton
      drawNeon(ctx, smoothed);
    } catch (err) {
      // swallow errors from a single frame to avoid app crash (white screen)
      // log for debugging
      // eslint-disable-next-line no-console
      console.warn("onResults frame processing error:", err);
    }
  }

  // small helper to compute angle between joints A-B-C where inputs are Joint[] entries
  function angleDeg(A?: Joint, B?: Joint, C?: Joint) {
    if (!A || !B || !C) return 0;
    const v1x = A.x - B.x, v1y = A.y - B.y;
    const v2x = C.x - B.x, v2y = C.y - B.y;
    const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
    if (m1 * m2 === 0) return 0;
    const dot = v1x * v2x + v1y * v2y;
    const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
    return (Math.acos(cos) * 180) / Math.PI;
  }

  function drawExoskeleton(ctx: CanvasRenderingContext2D, joints: Joint[]) {
    // draw neon overlay (clean, aesthetic)
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // faint bones
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 6;
    for (const [a, b] of POSE_CONNECTIONS) {
      const A = joints[a];
      const B = joints[b];
      if (!A || !B || A.visibility < 0.3 || B.visibility < 0.3) continue;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    // neon overlay
    ctx.strokeStyle = "rgba(46,230,166,0.95)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(46,230,166,0.9)";
    ctx.shadowBlur = 12;
    for (const [a, b] of POSE_CONNECTIONS) {
      const A = joints[a];
      const B = joints[b];
      if (!A || !B || A.visibility < 0.3 || B.visibility < 0.3) continue;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // joints
    for (const j of joints) {
      if (j.visibility < 0.3) continue;
      ctx.beginPath();
      ctx.fillStyle = "#0b1220";
      ctx.arc(j.x, j.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(46,230,166,0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function startSession() {
    repDetectorRef.current?.reset();
    setRepCount(0);
    setSetCount(0);
    setInSession(true);
    sessionStartRef.current = Date.now();
  }

  async function endSession() {
    if (!inSession || sessionStartRef.current == null) return;
    const summary = {
      startTime: sessionStartRef.current,
      endTime: Date.now(),
      exercise,
      sets: [
        {
          setNumber: 1,
          reps: repCount,
          weightKg,
          durationMs: Date.now() - sessionStartRef.current,
        },
      ],
      summaryMetrics: {
        totalReps: repCount,
        totalSets: setCount || 1,
        totalVolumeKg: repCount * weightKg,
      },
      device: { mode: "camera", model: "MediaPipeBrowser" },
      uploadedAt: Date.now(),
    };
    await uploadSession(summary);
    setInSession(false);
    sessionStartRef.current = null;
  }

  function onConsentAccept() {
    localStorage.setItem("fitflex_consent", "true");
    setConsentGiven(true);
  }

  if (!consentGiven) {
    return <ConsentModal onAccept={onConsentAccept} />;
  }

  return (
    <div className="mp-tracker-root">
      <div className="mp-header-row">
        <div className="mp-camera-status">Camera: {cameraReady ? "Ready" : "Waiting"}</div>
      </div>
      <div className="mp-header">
        <div className="mp-title">Live Tracking</div>
        <div className="mp-meta">
          <div className="mp-exercise">{exercise}</div>
          <div className="mp-counts">
            <div className="mp-rep">Reps <span className="mp-num">{repCount}</span></div>
            <div className="mp-set">Sets <span className="mp-num">{setCount}</span></div>
          </div>
        </div>
      </div>

      <div className="mp-canvas-wrap">
        <video ref={videoRef} className="mp-video" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="mp-canvas" />
      </div>

      <div className="mp-controls">
        <div className="mp-weight">
          <label>Weight (kg)</label>
          <input type="number" value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value || "0"))} />
        </div>
        <div className="mp-actions">
          {!inSession ? (
            <button className="btn primary" onClick={startSession}>Start Workout</button>
          ) : (
            <button className="btn danger" onClick={endSession}>End Workout</button>
          )}
          <button className="btn" onClick={() => repDetectorRef.current?.calibrate()}>Calibrate (3 reps)</button>
        </div>
      </div>
    </div>
  );
}
