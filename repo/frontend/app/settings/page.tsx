'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [enableInterventions, setEnableInterventions] = useState(true);
  const [notifyManager, setNotifyManager] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Settings</h1>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Enable Auto Interventions</div>
              <div className="text-sm text-zinc-400">Allow the agent to suggest breaks and reschedule meetings</div>
            </div>
            <input 
              type="checkbox" 
              checked={enableInterventions} 
              onChange={(e) => setEnableInterventions(e.target.checked)}
              className="w-5 h-5 accent-white"
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Notify Manager on High Risk</div>
              <div className="text-sm text-zinc-400">Send alerts when burnout risk exceeds 70%</div>
            </div>
            <input 
              type="checkbox" 
              checked={notifyManager} 
              onChange={(e) => setNotifyManager(e.target.checked)}
              className="w-5 h-5 accent-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Maximum meetings per day</label>
            <input type="number" defaultValue={6} className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
