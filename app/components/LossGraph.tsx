"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface LossGraphProps {
  lossData: { epoch: number; loss: number; val_loss: number }[];
}

export default function LossGraph({ lossData }: LossGraphProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
      <h3 className="text-white text-lg font-bold text-center">
        Training Loss Over Epochs
      </h3>

      {lossData.length === 0 ? (
        <p className="text-gray-400 text-center">No training data available yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lossData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" tick={{ fill: "white" }} />
            <YAxis tick={{ fill: "white" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
              labelStyle={{ color: "white" }}
              itemStyle={{ color: "white" }}
            />
            <Line
              type="monotone"
              dataKey="loss"
              stroke="#ff7300"
              strokeWidth={2}
              name="Training Loss"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="val_loss"
              stroke="#387908"
              strokeWidth={2}
              name="Validation Loss"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
