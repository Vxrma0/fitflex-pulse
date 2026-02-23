// Simple rep detection state machine for web demo.
// Uses accelerometer magnitude and derivative heuristics.

type Sample = { ts: number; mag: number };

export class RepDetector {
  private buffer: Sample[] = [];
  private _repCount = 0;
  private _setCount = 0;
  private state: "idle" | "up" | "top" | "down" | "complete" = "idle";
  private lastRepTs = 0;
  private listeners: Array<(s: { repCount: number; setCount: number; state: string }) => void> = [];

  // tunables
  amplitudeThreshold = 0.12;
  minRepDurationMs = 300;
  maxRepDurationMs = 8000;
  setTimeoutSeconds = 10;

  private setTimer?: number;

  get repCount() { return this._repCount; }
  get setCount() { return this._setCount; }
  get currentState() { return this.state; }

  pushSample(ts: number, ax: number, ay: number, az: number) {
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);
    this.buffer.push({ ts, mag });
    if (this.buffer.length > 500) this.buffer.splice(0, this.buffer.length - 500);
    this.process();
  }

  reset() {
    this.buffer = [];
    this._repCount = 0;
    this._setCount = 0;
    this.state = "idle";
    this.lastRepTs = 0;
    if (this.setTimer) {
      clearTimeout(this.setTimer);
      this.setTimer = undefined;
    }
    this.emit();
  }

  onChange(cb: (s: { repCount: number; setCount: number; state: string }) => void) {
    this.listeners.push(cb);
    cb({ repCount: this._repCount, setCount: this._setCount, state: this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emit() {
    const snapshot = { repCount: this._repCount, setCount: this._setCount, state: this.state };
    this.listeners.forEach((l) => l(snapshot));
  }

  private process() {
    if (this.buffer.length < 3) return;
    const last = this.buffer[this.buffer.length - 1];
    const prev = this.buffer[this.buffer.length - 2];
    const derivative = last.mag - prev.mag;

    switch (this.state) {
      case "idle":
        if (derivative > this.amplitudeThreshold / 4) this.state = "up";
        break;
      case "up":
        if (derivative < 0 && last.mag > prev.mag && last.mag > this.amplitudeThreshold) this.state = "top";
        break;
      case "top":
        if (derivative < -this.amplitudeThreshold / 8) this.state = "down";
        break;
      case "down":
        if (Math.abs(derivative) < 0.01) {
          const now = last.ts;
          const duration = this.lastRepTs === 0 ? now : now - this.lastRepTs;
          if (this.lastRepTs === 0 || (duration >= this.minRepDurationMs && duration <= this.maxRepDurationMs)) {
            this.registerRep(now);
          }
          this.state = "complete";
        }
        break;
      case "complete":
        if (Math.abs(derivative) < 0.005) this.state = "idle";
        break;
    }
  }

  private registerRep(ts: number) {
    this._repCount += 1;
    this.lastRepTs = ts;
    if (this.setTimer) {
      clearTimeout(this.setTimer);
    }
    this.setTimer = window.setTimeout(() => {
      if (this._repCount > 0) {
        this._setCount += 1;
        this._repCount = 0;
        this.emit();
      }
    }, this.setTimeoutSeconds * 1000);
    this.emit();
  }
}
