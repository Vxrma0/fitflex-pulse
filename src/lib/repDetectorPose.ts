import { Joint } from "./poseSmoothing";

type DetectorOptions = { exercise?: string; minRepMs?: number; maxRepMs?: number; setTimeoutSec?: number };

export class RepDetectorPose {
  exercise: string;
  repCount = 0;
  setCount = 0;
  private state: "idle" | "descending" | "bottom" | "ascending" | "top" = "idle";
  private lastRepTs = 0;
  private setTimer: number | null = null;
  private minRepMs: number;
  private maxRepMs: number;
  private setTimeoutSec: number;

  private calibSamples: number[] = [];
  private calibratedThreshold = 20;

  constructor(opts?: DetectorOptions) {
    this.exercise = opts?.exercise ?? "Bicep Curl";
    this.minRepMs = opts?.minRepMs ?? 300;
    this.maxRepMs = opts?.maxRepMs ?? 8000;
    this.setTimeoutSec = opts?.setTimeoutSec ?? 10;
  }

  reset() {
    this.repCount = 0;
    this.setCount = 0;
    this.state = "idle";
    this.lastRepTs = 0;
    if (this.setTimer) {
      clearTimeout(this.setTimer);
      this.setTimer = null;
    }
  }

  calibrate() {
    this.calibSamples = [];
  }

  private angle(A: Joint, B: Joint, C: Joint) {
    const v1 = { x: A.x - B.x, y: A.y - B.y };
    const v2 = { x: C.x - B.x, y: C.y - B.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 * mag2 === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return (Math.acos(cos) * 180) / Math.PI;
  }

  updateFromPose(joints: Joint[]) {
    const leftVis = (joints[11]?.visibility ?? 0) + (joints[13]?.visibility ?? 0) + (joints[15]?.visibility ?? 0);
    const rightVis = (joints[12]?.visibility ?? 0) + (joints[14]?.visibility ?? 0) + (joints[16]?.visibility ?? 0);
    const side = rightVis > leftVis ? "right" : "left";

    const shoulder = joints[side === "right" ? 12 : 11];
    const elbow = joints[side === "right" ? 14 : 13];
    const wrist = joints[side === "right" ? 16 : 15];

    if (!shoulder || !elbow || !wrist) return { repIncrement: false, setIncrement: false };

    const angle = this.angle(shoulder, elbow, wrist);
    if (this.calibSamples && this.calibSamples.length < 3) {
      if (angle < 100) {
        this.calibSamples.push(angle);
      }
      if (this.calibSamples.length >= 3) {
        const meanBottom = this.calibSamples.reduce((a, b) => a + b, 0) / this.calibSamples.length;
        this.calibratedThreshold = Math.max(18, Math.min(60, 160 - meanBottom - 10));
        this.calibSamples = [];
      }
    }

    const ampThreshold = this.calibratedThreshold;
    const bottomThreshold = 90;
    const topThreshold = 150;

    let repIncrement = false;
    let setIncrement = false;
    switch (this.state) {
      case "idle":
        if (angle < bottomThreshold) {
          this.state = "bottom";
        } else if (angle < topThreshold && angle < 140) {
          this.state = "descending";
        }
        break;
      case "descending":
        if (angle < bottomThreshold) {
          this.state = "bottom";
        }
        break;
      case "bottom":
        if (angle > bottomThreshold + 8) {
          this.state = "ascending";
        }
        break;
      case "ascending":
        if (angle > topThreshold) {
          const now = Date.now();
          const duration = this.lastRepTs === 0 ? now : now - this.lastRepTs;
          if (this.lastRepTs === 0 || (duration >= this.minRepMs && duration <= this.maxRepMs)) {
            this.repCount += 1;
            repIncrement = true;
            this.lastRepTs = now;
            if (this.setTimer) clearTimeout(this.setTimer);
            this.setTimer = window.setTimeout(() => {
              if (this.repCount > 0) {
                this.setCount += 1;
                this.repCount = 0;
                setIncrement = true;
              }
            }, this.setTimeoutSec * 1000);
          }
          this.state = "top";
        }
        break;
      case "top":
        if (angle < topThreshold - 8) {
          this.state = "descending";
        }
        break;
    }

    return { repIncrement, setIncrement };
  }
}
