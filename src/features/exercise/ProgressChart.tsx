import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { type SetLog, dayKey } from "../../db/schema";
import { e1rm, round, toDisplay, volume } from "../../domain/fitness";
export default function ProgressChart({
  sets,
  unit,
}: {
  sets: SetLog[];
  unit: string;
}) {
  const [metric, setMetric] = useState("Weight");
  const [range, setRange] = useState("All");
  const cutoff =
    range === "All"
      ? 0
      : Date.now() - ({ "1M": 30, "3M": 90, "1Y": 365 }[range] ?? 0) * 86400000;
  const groups = new Map<string, SetLog[]>();
  sets
    .filter((s) => s.createdAt >= cutoff && !s.isWarmup)
    .forEach((s) => {
      const date = dayKey(s.createdAt);
      groups.set(date, [...(groups.get(date) ?? []), s]);
    });
  const data = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const best = rows.reduce((a, b) =>
        (
          metric === "Estimated 1RM"
            ? e1rm(a.weight, a.reps) >= e1rm(b.weight, b.reps)
            : a.weight >= b.weight
        )
          ? a
          : b,
      );
      return {
        date,
        value: round(
          toDisplay(
            metric === "Volume"
              ? volume(rows)
              : metric === "Estimated 1RM"
                ? e1rm(best.weight, best.reps)
                : best.weight,
            unit,
          ),
        ),
        detail: `${round(toDisplay(best.weight, unit))} ${unit} × ${best.reps}`,
        pr: rows.some((s) => s.isPR),
      };
    });
  return (
    <section className="chart-section">
      <div className="section-title">
        <h2>Progress</h2>
        <span>
          {unit}
          {metric === "Volume" ? " · reps" : ""}
        </span>
      </div>
      <div className="segments small">
        {["Weight", "Estimated 1RM", "Volume"].map((m) => (
          <button
            key={m}
            className={metric === m ? "active" : ""}
            onClick={() => setMetric(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="range-buttons">
        {["1M", "3M", "1Y", "All"].map((r) => (
          <button
            className={range === r ? "selected" : ""}
            key={r}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>
      {data.length ? (
        <>
          <div
            className="chart"
            role="img"
            aria-label={`Progress chart with ${data.length} sessions`}
          >
            <ResponsiveContainer width="100%" height={210}>
              <LineChart
                data={data}
                margin={{ top: 15, right: 15, bottom: 5, left: -20 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 5"
                  stroke="var(--line)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        {payload[0].payload.date}
                        <br />
                        {payload[0].payload.detail}
                        <br />
                        {metric}: {payload[0].value}
                        {payload[0].payload.pr ? " ★ PR" : ""}
                      </div>
                    ) : null
                  }
                />
                <Line
                  dataKey="value"
                  stroke="#E36952"
                  strokeWidth={3}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      key={payload.date}
                      cx={cx}
                      cy={cy}
                      r={payload.pr ? 6 : 4}
                      fill={payload.pr ? "#cf9b3f" : "#E36952"}
                      stroke="var(--bg)"
                      strokeWidth={2}
                    />
                  )}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="caption">
            Tap a point for details · Gold points mark personal records
          </p>
        </>
      ) : (
        <p className="empty">
          Log your first working set to start your progress chart.
        </p>
      )}
    </section>
  );
}
