'use client';

import React from 'react';

export default function InterventionsPage() {
  const interventions = [
    { id: 1, user: "David Kim", action: "Suggested 30-min focus block", time: "2h ago", status: "Completed" },
    { id: 2, user: "Alice Chen", action: "Rescheduled 3pm meeting", time: "Yesterday", status: "Completed" },
    { id: 3, user: "Bob Rivera", action: "Manager notified", time: "2 days ago", status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Intervention History</h1>
        
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr className="text-left text-sm text-zinc-400">
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800 last:border-0">
                  <td className="p-4 font-medium">{item.user}</td>
                  <td className="p-4 text-zinc-300">{item.action}</td>
                  <td className="p-4 text-sm text-zinc-400">{item.time}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      item.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
