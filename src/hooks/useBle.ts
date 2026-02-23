import { useEffect, useState } from "react";

type Telemetry = {
  timestamp?: number;
  accel?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
  battery?: number;
};

declare global {
  interface Window {
    __BLE_SIMULATOR_PUSH?: (packet: Telemetry) => void;
  }
}

export function useBle() {
  const [deviceName, setDeviceName] = useState("");
  const [batteryPercent, setBatteryPercent] = useState(0);
  const [lastPacket, setLastPacket] = useState<Telemetry | null>(null);
  const [connectionState, setConnectionState] = useState<"disconnected" | "scanning" | "connected">("disconnected");

  useEffect(() => {
    window.__BLE_SIMULATOR_PUSH = (packet: Telemetry) => {
      setLastPacket(packet);
      if (packet.battery != null) setBatteryPercent(packet.battery);
      setDeviceName((prev) => prev || "SimBand-001");
      setConnectionState("connected");
    };
    return () => {
      delete window.__BLE_SIMULATOR_PUSH;
    };
  }, []);

  const startScan = async () => {
    setConnectionState("scanning");
    setTimeout(() => setConnectionState("connected"), 800);
  };

  const disconnect = async () => {
    setConnectionState("disconnected");
    setDeviceName("");
    setBatteryPercent(0);
    setLastPacket(null);
  };

  return { deviceName, batteryPercent, lastPacket, connectionState, startScan, disconnect };
}
