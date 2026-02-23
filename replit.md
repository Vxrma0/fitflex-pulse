# FitFlex Ultra

## Overview
FitFlex Ultra is an AI Smart Gym prototype (V1.0) built with React, TypeScript, and Vite. It features rep counting, form scoring, tempo tracking, BLE simulation, and live tracking capabilities using MediaPipe Pose estimation.

## Architecture
- **Frontend-only** Vite + React application (no backend server)
- Uses React Router v6 for client-side routing
- Styled with Tailwind CSS and shadcn/ui components
- TanStack React Query for data fetching

## Key Pages
- `/` - Main dashboard with rep counter, pose visualizer, metric cards, and gym data library
- `/live` - Live tracking panel

## Key Components
- `HeroRepCounter` - Main rep counting display with 5-stage state machine
- `PoseVisualizer` - Live feed / pose estimation display
- `MetricCard` - Form score, tempo, detection, total reps cards
- `BleSimulator` - Bluetooth Low Energy device simulator
- `CalibrationStatus` - Calibration state display
- `LiveTrackingPanel` - Live tracking interface
- `RepLog` - Rep logging / gym data library
- `ParticleEffects` - Visual particle effects

## Hooks
- `useBle` - BLE device connection simulation
- `useGymSimulation` - Gym workout simulation logic
- `use-mobile` - Mobile device detection
- `use-toast` - Toast notification system

## Tech Stack
- React 18, TypeScript, Vite 5
- Tailwind CSS 3, shadcn/ui (Radix UI primitives)
- React Router DOM v6
- TanStack React Query v5
- Recharts for data visualization
- Lucide React for icons

## Development
- Run: `npm run dev` (Vite dev server on port 5000)
- Build: `npm run build`
