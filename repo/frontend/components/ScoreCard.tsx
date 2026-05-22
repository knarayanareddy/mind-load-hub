'use client';

import React from 'react';

interface ScoreCardProps {
  name: string;
  load: number;
  risk: number;
  status: string;
}

export function ScoreCard({ name, load, risk, status }: ScoreCardProps) {
  const statusColor = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }[status] || 'bg-zinc-500';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium text-lg">{name}</div>
          <div className="text-sm text-zinc-400">Cognitive Load</div>
        </div>
        <div className={`${statusColor} px-3 py-0.5 rounded-full text-xs font-medium`}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className="text-5xl font-semibold tracking-tighter mb-1">{load}</div>
      <div className="text-sm text-zinc-400 mb-4">Load Score</div>

      <div className="flex justify-between text-sm">
        <div>
          <span className="text-zinc-400">Burnout Risk</span>
          <div className="font-medium">{risk}%</div>
        </div>
        <div className="text-right">
          <span className="text-zinc-400">Trend</span>
          <div className="font-medium text-emerald-400">↑ Improving</div>
        </div>
      </div>
    </div>
  );
}
