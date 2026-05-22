'use client';

import React from 'react';

export default function AlertsPage() {
  const alerts = [
    { id: 1, user: "David Kim", message: "Cognitive load reached 91. Manager notified.", severity: "critical" },
    { id: 2, user: "Alice Chen", message: "3 consecutive days with high meeting load.", severity: "high" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Manager Alerts</h1>
        
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{alert.user}</div>
                  <div className="text-zinc-300 mt-1">{alert.message}</div>
                </div>
                <div className={`text-xs px-3 py-1 h-fit rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {alert.severity.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
