import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartData } from "@shared/types";

interface PriceChartProps {
  data: ChartData[];
}

export default function PriceChart({ data }: PriceChartProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => `₹${value}`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: number) => [`₹${value}`, "Price"]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="rgb(var(--primary))"
            fill="rgba(var(--primary), 0.1)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
