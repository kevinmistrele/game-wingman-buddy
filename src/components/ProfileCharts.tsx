import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { LolMatch } from "@/hooks/useRiotMatches";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "#f59e0b",
];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  },
};

const ProfileCharts = ({ matches }: { matches: LolMatch[] }) => {
  const reversed = useMemo(() => [...matches].reverse(), [matches]);

  const winRateData = useMemo(() => {
    let wins = 0;
    return reversed.map((m, i) => {
      if (m.win) wins++;
      return { name: `${i + 1}`, winRate: Math.round((wins / (i + 1)) * 100) };
    });
  }, [reversed]);

  const kdaData = useMemo(
    () =>
      reversed.map((m, i) => ({
        name: `${i + 1}`,
        Kills: m.kills,
        Deaths: m.deaths,
        Assists: m.assists,
      })),
    [reversed]
  );

  const damageData = useMemo(
    () =>
      reversed.map((m, i) => ({
        name: `${i + 1}`,
        Dano: m.damage,
      })),
    [reversed]
  );

  const csData = useMemo(
    () =>
      reversed.map((m, i) => ({
        name: `${i + 1}`,
        "CS/min": m.duration > 0 ? parseFloat((m.cs / (m.duration / 60)).toFixed(1)) : 0,
      })),
    [reversed]
  );

  const champPieData = useMemo(() => {
    const map: Record<string, number> = {};
    matches.forEach((m) => {
      map[m.champion] = (map[m.champion] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [matches]);

  if (!matches.length) return null;

  return (
    <div className="space-y-6">
      {/* Win Rate */}
      <div className="border border-border gradient-card p-5">
        <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-4">WIN RATE ACUMULADO</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={winRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="winRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Win Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KDA */}
      <div className="border border-border gradient-card p-5">
        <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-4">KDA POR PARTIDA</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={kdaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Kills" stackId="a" fill="hsl(var(--primary))" />
            <Bar dataKey="Assists" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Deaths" stackId="a" fill="hsl(var(--destructive))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Damage */}
        <div className="border border-border gradient-card p-5">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-4">DANO POR PARTIDA</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={damageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="Dano" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CS/min */}
        <div className="border border-border gradient-card p-5">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-4">CS/MIN POR PARTIDA</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={csData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="CS/min" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Champion Distribution */}
      <div className="border border-border gradient-card p-5">
        <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-4">DISTRIBUIÇÃO DE CAMPEÕES</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={champPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {champPieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfileCharts;
