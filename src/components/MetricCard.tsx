interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color: "pink" | "cyan" | "green" | "purple";
  icon?: string;
}

const colorMap = {
  pink: { text: "neon-text-pink", border: "glow-border-pink", bar: "bg-neon-pink" },
  cyan: { text: "neon-text-cyan", border: "glow-border-cyan", bar: "bg-neon-cyan" },
  green: { text: "neon-text-green", border: "glow-border-green", bar: "bg-signal-green" },
  purple: { text: "text-neon-purple", border: "", bar: "bg-neon-purple" },
};

const MetricCard = ({ label, value, unit, color, icon }: MetricCardProps) => {
  const c = colorMap[color];
  const numValue = typeof value === "number" ? value : parseInt(value);
  const showBar = !isNaN(numValue) && numValue <= 100;

  return (
    <div className={`glass rounded-xl p-4 ${c.border} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-outfit font-bold ${c.text}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-mono text-muted-foreground">{unit}</span>
        )}
      </div>
      {showBar && (
        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${numValue}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
