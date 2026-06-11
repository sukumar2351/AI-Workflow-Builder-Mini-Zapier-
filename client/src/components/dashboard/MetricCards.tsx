import React from 'react';
import { GitBranch, Activity, Zap, CheckCircle } from 'lucide-react';

interface MetricCardsProps {
  stats: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
  };
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows,
      icon: GitBranch,
      description: 'Created automations',
      color: 'text-indigo-400 border-indigo-500/20 shadow-indigo-500/5',
    },
    {
      title: 'Active Automations',
      value: stats.activeWorkflows,
      icon: Activity,
      description: 'Currently running live',
      color: 'text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
    },
    {
      title: 'Total Executions',
      value: stats.totalExecutions,
      icon: Zap,
      description: 'Triggered run events',
      color: 'text-amber-400 border-amber-500/20 shadow-amber-500/5',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      description: 'Successful executions',
      color: 'text-purple-400 border-purple-500/20 shadow-purple-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-6 flex flex-col justify-between border shadow-lg transition-all hover:scale-[1.02] ${card.color}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400">{card.title}</span>
              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                {card.value}
              </h3>
              <p className="text-xs text-gray-400">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
