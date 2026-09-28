import { useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { BodyWeight } from "../../db/schema";
import { round, toDisplay } from "../../domain/fitness";
export default function WeightChart({
  weights,
  unit,
  selectedIndex = 0,
  onSelect,
}: {
  weights: BodyWeight[];
  unit: string;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const dragging = useRef(false);
  if (!weights.length)
    return (
      <p className="empty">
        Add your first weight and photo. Your timeline starts here.
      </p>
    );
  const data = weights.map((w) => ({
    date: w.date,
    weight: round(toDisplay(w.kg, unit)),
  }));
  function select(clientX: number, element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    const x = (clientX - rect.left - 40) / Math.max(1, rect.width - 55);
    onSelect?.(
      Math.max(
        0,
        Math.min(weights.length - 1, Math.round(x * (weights.length - 1))),
      ),
    );
  }
  return (
    <div
      className="weight-chart"
      aria-label="Interactive body weight graph"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        select(e.clientX, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (dragging.current) select(e.clientX, e.currentTarget);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => (dragging.current = false)}
    >
      <ResponsiveContainer width="100%" height={190}>
        <LineChart
          data={data}
          margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={(d) => d.slice(5)}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={40}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip />
          <ReferenceLine
            x={data[selectedIndex]?.date}
            stroke="#e36952"
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#e36952"
            strokeWidth={3}
            isAnimationActive={false}
            dot={({ cx, cy, index }) => (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={index === selectedIndex ? 7 : 4}
                fill={index === selectedIndex ? "#e36952" : "var(--bg)"}
                stroke="#e36952"
                strokeWidth={2}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
