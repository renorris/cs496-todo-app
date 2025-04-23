"use client"

import { PieChart as Chart, Pie, Cell, ResponsiveContainer } from "@/components/ui/chart"

interface PieChartProps {
  completed: number
  total: number
}

export function PieChart({ completed, total }: PieChartProps) {
  const incomplete = total - completed
  const data = [
    { name: "Completed", value: completed },
    { name: "Incomplete", value: incomplete },
  ]

  const COLORS = ["#4ade80", "#e4e4e7"]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </Chart>
    </ResponsiveContainer>
  )
}
