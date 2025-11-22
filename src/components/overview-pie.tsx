"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface OverviewPieProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "#2980b9", // Primary Blue
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#e74c3c", // Red
  "#9b59b6", // Purple
  "#3498db", // Light Blue
];

export const OverviewPie: React.FC<OverviewPieProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${((percent || 0) * 100).toFixed(0)}%`
          }
          outerRadius={120}
          innerRadius={60}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              style={{ transition: "fill 0.2s" }}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(value)
          }
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            padding: "8px",
            fontSize: "14px",
          }}
        />

        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: "20px",
            fontSize: "13px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default OverviewPie;
