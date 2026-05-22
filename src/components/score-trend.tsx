import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ScoreTrend({
  data,
}: {
  data: { score: number; computed_at: string; alert_level: string }[];
}) {
  const series = data.map((d) => ({
    time: new Date(d.computed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: Number(d.score),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#g)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
