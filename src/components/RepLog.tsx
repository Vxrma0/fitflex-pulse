interface RepEntry {
  id: number;
  timestamp: string;
  formScore: number;
  tempo: string;
  feedback: string;
  quality: "good" | "bad";
}

interface RepLogProps {
  entries: RepEntry[];
}

const RepLog = ({ entries }: RepLogProps) => {
  return (
    <div className="glass rounded-2xl p-4 glow-border-pink">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          📋 Gym Data Library
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          gym_data_library.csv
        </span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
        {entries.length === 0 ? (
          <p className="text-xs font-mono text-muted-foreground text-center py-4">
            Waiting for first rep...
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-xs font-mono"
            >
              <span className="text-muted-foreground w-16">{entry.timestamp}</span>
              <span className={entry.quality === "good" ? "neon-text-green" : "neon-text-red"}>
                {entry.formScore}%
              </span>
              <span className="text-muted-foreground">{entry.tempo}</span>
              <span className="truncate max-w-[120px]">{entry.feedback}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepLog;
