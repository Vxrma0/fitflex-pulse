import { useEffect, useState } from "react";

interface FeedbackBannerProps {
  message: string;
  type: "good" | "bad" | "neutral";
  visible: boolean;
}

const FeedbackBanner = ({ message, type, visible }: FeedbackBannerProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show && !visible) return null;

  const styles = {
    good: {
      bg: "bg-signal-green/10 border-signal-green/40",
      text: "neon-text-green",
      icon: "✅",
    },
    bad: {
      bg: "bg-signal-red/10 border-signal-red/40",
      text: "neon-text-red",
      icon: "⚠️",
    },
    neutral: {
      bg: "bg-neon-cyan/10 border-neon-cyan/40",
      text: "neon-text-cyan",
      icon: "💪",
    },
  };

  const s = styles[type];

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl glass border ${s.bg} 
        ${visible ? "animate-slide-in" : "opacity-0 -translate-y-full"} transition-all duration-300`}
    >
      <span className={`font-outfit font-semibold text-sm ${s.text}`}>
        {s.icon} {message}
      </span>
    </div>
  );
};

export default FeedbackBanner;
