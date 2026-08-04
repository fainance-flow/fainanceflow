"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type Props = {
  data: number[];
  color?: string;
  height?: number;
};

const Sparkline = ({ data, color = "rgb(var(--c-gold))", height = 32 }: Props) => {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.6}
            dot={false}
            strokeLinecap="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
