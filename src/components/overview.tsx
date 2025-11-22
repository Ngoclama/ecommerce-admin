"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatter } from "@/lib/utils";

interface OverviewProps {
  data: any[];
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            formatter.format(value).replace(",00", "").replace(".00", "")
          }
        />

        <Tooltip
          cursor={{ opacity: 0.1 }}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            padding: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          formatter={(value: number) => formatter.format(value)}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))" 
          radius={[4, 4, 0, 0]}
          className="fill-primary transition-colors duration-200 hover:opacity-80"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Overview;
