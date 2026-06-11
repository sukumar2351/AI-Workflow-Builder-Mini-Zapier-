import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ExecutionChartProps {
  data: {
    date: string;
    runs: number;
    success: number;
    failed: number;
  }[];
}

export const ExecutionChart: React.FC<ExecutionChartProps> = ({ data }) => {
  return (
    <div className="glass-panel border border-neutral-800 rounded-2xl p-6 shadow-xl h-[320px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Execution History</h3>
          <p className="text-xs text-gray-400">Total automated runs over the last 7 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-gray-400">Total Runs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
            <span className="text-gray-400">Success Rate</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[220px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            No executions recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#4b5563" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#4b5563" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D0D11',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="runs" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRuns)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
