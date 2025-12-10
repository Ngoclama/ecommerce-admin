"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatter } from "@/lib/utils";

interface OverviewPieProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "#2980b9", 
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#e74c3c", // Red
  "#9b59b6", // Purple
  "#3498db", // Light Blue
  "#1abc9c", // Turquoise
  "#e67e22", // Dark Orange
  "#34495e", // Dark Gray
  "#16a085", // Dark Turquoise
  "#c0392b", // Dark Red
  "#8e44ad", // Dark Purple
];

export const OverviewPie: React.FC<OverviewPieProps> = ({ data }) => {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Sort data by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      {/* Donut Chart */}
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={50}
              paddingAngle={2}
              dataKey="value"
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{ transition: "fill 0.2s" }}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value: number) => {
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return [
                  `${formatter.format(value)} (${percent}%)`,
                  "Doanh thu"
                ];
              }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                padding: "8px",
                fontSize: "14px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Product List Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
              <TableHead className="text-right w-24">Tỷ lệ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => {
              const percent = total > 0 ? ((item.value / total) * 100) : 0;
              return (
                <TableRow 
                  key={item.name}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatter.format(item.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {percent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OverviewPie;
