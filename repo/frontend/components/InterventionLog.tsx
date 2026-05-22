'use client';
import React from 'react';

export function InterventionLog() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="font-medium mb-4">Recent Interventions</h3>
      <ul className="text-sm space-y-2 text-zinc-400">
        <li>• Blocked focus time for Alice (2h ago)</li>
        <li>• Notified manager about David (Yesterday)</li>
      </ul>
    </div>
  );
}
