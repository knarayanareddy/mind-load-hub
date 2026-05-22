'use client';
import React from 'react';

export function AlertPanel() {
  return (
    <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6">
      <h3 className="font-medium text-red-400 mb-3">Active Alerts</h3>
      <div className="text-sm">2 team members currently at critical load levels.</div>
    </div>
  );
}
