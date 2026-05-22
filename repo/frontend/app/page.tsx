'use client';

import React, { useEffect, useState } from 'react';
import { 
  Brain, Zap, Calendar, MessageSquare, Clock, Users, Activity, 
  Flame, Sparkles, AlertTriangle, CheckCircle, RefreshCw, X, ShieldAlert, ArrowUpRight, ArrowDownRight, MoveRight
} from 'lucide-react';
import { HeatMap } from '@/components/HeatMap';

interface ComponentScores {
  temporal: number;
  communication: number;
  task_switching: number;
  boundary: number;
  sentiment: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  cl_score: number;
  alert_level: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'BURNOUT';
  in_flow_state: boolean;
  burnout_risk_pct: number;
  top_risk_factors: string[];
  recent_interventions: string[];
  score_trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  component_scores: ComponentScores;
}

interface InterventionLogEntry {
  id: string;
  person_name: string;
  triggered_by: string;
  intervention_type: string;
  outcome: string;
  details: string;
  cl_before: number;
  cl_after: number;
  created_at: string;
}

export default function Dashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [averageLoad, setAverageLoad] = useState<number>(0);
  const [highRiskUsers, setHighRiskUsers] = useState<string[]>([]);
  const [logs, setLogs] = useState<InterventionLogEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Helper to fetch data initially and refresh logs
  const refreshData = async () => {
    try {
      const res = await fetch('http://localhost:8000/team/overview');
      const data = await res.json();
      setTeamMembers(data.team_members);
      setAverageLoad(data.average_load);
      setHighRiskUsers(data.high_risk_users);

      // Fetch logs
      const logRes = await fetch('http://localhost:8000/interventions/');
      const logData = await logRes.json();
      setLogs(logData.interventions || []);
    } catch (err) {
      console.error("Failed to query API endpoints:", err);
    }
  };

  useEffect(() => {
    refreshData();

    // Establish dynamic WebSocket connection
    let socket: WebSocket;
    const connectWS = () => {
      socket = new WebSocket('ws://localhost:8000/ws/team/core-engineering-id');
      
      socket.onopen = () => {
        setWsConnected(true);
        console.log("WebSocket connected to backend.");
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "SCORE_UPDATE") {
          setTeamMembers(msg.team_members);
          
          // Compute averages dynamically
          const scores = msg.team_members.map((m: any) => m.cl_score);
          const avg = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : 0;
          setAverageLoad(Number(avg));
          setHighRiskUsers(msg.team_members.filter((m: any) => m.cl_score >= 80).map((m: any) => m.name));
          
          // Re-fetch latest logs to show actions instantly in log view
          fetch('http://localhost:8000/interventions/')
            .then(res => res.json())
            .then(data => setLogs(data.interventions || []))
            .catch(err => console.error(err));
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connectWS, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connectWS();
    return () => socket?.close();
  }, []);

  // Update selected member data in real-time when WebSocket changes
  useEffect(() => {
    if (selectedMember) {
      const updated = teamMembers.find(m => m.id === selectedMember.id);
      if (updated) setSelectedMember(updated);
    }
  }, [teamMembers, selectedMember]);

  // Monday morning simulator
  const handleMondaySimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('http://localhost:8000/team/simulate', { method: 'POST' });
      const data = await res.json();
      console.log(data.message);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Auto-optimize all critical members
  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      const criticalMembers = teamMembers.filter(m => m.cl_score >= 80);
      if (criticalMembers.length === 0) {
        alert("No critical team members require immediate active balancing right now!");
        return;
      }
      
      for (const m of criticalMembers) {
        await fetch('http://localhost:8000/interventions/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person_id: m.id, mode: 'auto' })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Trigger manual interventions
  const handleManualIntervention = async (personId: string, actionType: string) => {
    try {
      const res = await fetch('http://localhost:8000/interventions/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: personId, action: actionType })
      });
      const data = await res.json();
      console.log(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  // Style helpers
  const getAlertLevelColors = (level: string, score: number) => {
    switch (level) {
      case 'OPTIMAL':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
          badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/15',
          border: 'border-amber-500/30 hover:border-amber-500/60',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
          badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10 hover:bg-orange-500/15',
          border: 'border-orange-500/30 hover:border-orange-500/60',
          text: 'text-orange-400',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
          badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
        };
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/10 hover:bg-red-500/15 pulse-critical',
          border: 'border-red-500/40 hover:border-red-500/70',
          text: 'text-red-400',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
          badge: 'bg-red-500/20 text-red-400 border border-red-500/30'
        };
      case 'BURNOUT':
        return {
          bg: 'bg-pink-500/10 hover:bg-pink-500/15 pulse-burnout',
          border: 'border-pink-500/50 hover:border-pink-500/80',
          text: 'text-pink-400',
          glow: 'shadow-[0_0_25px_rgba(236,72,153,0.35)]',
          badge: 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
        };
      default:
        return {
          bg: 'bg-zinc-800/40 hover:bg-zinc-800/60',
          border: 'border-zinc-700/50',
          text: 'text-zinc-400',
          glow: '',
          badge: 'bg-zinc-800 text-zinc-400'
        };
    }
  };

  const getScoreColor = (val: number) => {
    if (val <= 40) return 'bg-emerald-500';
    if (val <= 65) return 'bg-amber-500';
    if (val <= 80) return 'bg-orange-500';
    if (val <= 90) return 'bg-red-500';
    return 'bg-pink-500';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-pink-900/5 blur-[120px] pointer-events-none" />

      {/* Header navbar */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-lg text-white">CogniLoad Balancer</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">v1.2</span>
            </div>
            <span className="text-xs text-zinc-400">Human Attention Capacity Management Engine</span>
          </div>
        </div>

        {/* Live sync indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-full px-3.5 py-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-zinc-400">{wsConnected ? 'Connected via WebSocket' : 'Reconnecting...'}</span>
          </div>
          
          <button 
            onClick={refreshData}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* Top Summary stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">Team Size</span>
              <span className="text-3xl font-bold text-white mt-1.5 block">{teamMembers.length}</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Active full-time members</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">Average Cognitive Load</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-bold text-white block">{averageLoad}</span>
                <span className="text-xs text-zinc-400">/ 100</span>
              </div>
              <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className={`h-full ${getScoreColor(averageLoad)}`} style={{ width: `${averageLoad}%` }} />
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">Critical & Burnout Alert</span>
              <span className="text-3xl font-bold text-red-400 mt-1.5 block">{highRiskUsers.length}</span>
              <span className="text-[10px] text-red-500 font-medium block mt-1">Requires immediate balancing</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">Flow State Ratio</span>
              <span className="text-3xl font-bold text-cyan-400 mt-1.5 block">
                {teamMembers.filter(m => m.in_flow_state).length} / {teamMembers.length}
              </span>
              <span className="text-[10px] text-cyan-500 font-medium block mt-1">🌊 Deep work protected</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </section>

        {/* Action triggers */}
        <section className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/20">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-400" />
              Real-time Active Load Simulations
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Simulate real workplace stress events, then watch the orchestrated agent optimize team schedules instantly in real-time.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleMondaySimulation}
              disabled={isSimulating}
              className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? 'Simulating...' : '📅 Simulate Monday Morning'}
            </button>
            <button 
              onClick={handleAutoOptimize}
              disabled={isOptimizing || teamMembers.filter(m => m.cl_score >= 80).length === 0}
              className="flex-1 md:flex-none bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isOptimizing ? 'Balancing...' : '🚀 Auto-Optimize Team'}
            </button>
          </div>
        </section>

        {/* Heat Map grid — spec-aligned glowing cells */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">Team Attention Heat Map</h2>
            <span className="text-xs text-zinc-400">Click any cell to inspect signal metrics, logs, and trigger custom protections.</span>
          </div>

          <HeatMap
            data={teamMembers}
            onMemberClick={(id) => {
              const member = teamMembers.find(m => m.id === id);
              if (member) setSelectedMember(member);
            }}
          />
        </section>

        {/* Live log feed section */}
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Agent Audit Logs & Activity Feed
            </h2>
            <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Audit Trail</span>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-2">
            {logs.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-6">No load balancing logs recorded yet. Run simulation to populate trail.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-zinc-950/60 hover:bg-zinc-900/60 border border-zinc-900 p-3.5 rounded-xl flex items-center justify-between text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 text-indigo-400 border border-zinc-800">
                      {log.intervention_type.includes('Manager') ? <ShieldAlert className="h-4 w-4 text-pink-400" /> : <Calendar className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {log.person_name} 
                        <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                          {log.triggered_by}
                        </span>
                      </div>
                      <p className="text-zinc-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-red-400">{Math.round(log.cl_before)}</span>
                        <MoveRight className="h-3 w-3 text-zinc-500" />
                        <span className="text-emerald-400">{Math.round(log.cl_after)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">Relief</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                      {log.created_at}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* Slide-out detail panel overlay backdrop */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setSelectedMember(null)}
        >
          {/* Detail Panel */}
          <div 
            className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 md:p-8 flex flex-col gap-6 overflow-y-auto animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedMember.avatar_url} 
                  alt={selectedMember.name} 
                  className="h-16 w-16 rounded-2xl bg-zinc-800 border border-zinc-700/50"
                />
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedMember.name}</h2>
                  <span className="text-sm text-zinc-400 block mt-0.5">{selectedMember.role}</span>
                  
                  {/* Alert level badge */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${getAlertLevelColors(selectedMember.alert_level, selectedMember.cl_score).badge}`}>
                      {selectedMember.alert_level}
                    </span>
                    {selectedMember.in_flow_state && (
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        🌊 In Flow
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Breakdown bar chart */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-3.5">Component Score Breakdown</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(selectedMember.component_scores).map(([key, val]) => (
                  <div key={key} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 flex items-center justify-between gap-4">
                    <div className="w-32">
                      <span className="text-xs font-semibold text-zinc-300 capitalize block">{key.replace('_', ' ')}</span>
                    </div>
                    <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getScoreColor(val)}`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <div className="w-8 text-right">
                      <span className="text-xs font-bold text-white">{Math.round(val)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk factors list */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-3">⚠️ Detected Risk Factors</h3>
              {selectedMember.top_risk_factors.length === 0 ? (
                <div className="text-zinc-500 text-xs py-2">No active load overload indicators detected for this member.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedMember.top_risk_factors.map((rf, i) => (
                    <div key={i} className="bg-red-950/10 border border-red-900/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active manual interventions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-500">🛡️ Manual Action Dispatcher</h3>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">Admin Tools</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleManualIntervention(selectedMember.id, 'focus_block')}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>🎯 Add Focus Block</span>
                </button>
                <button 
                  onClick={() => handleManualIntervention(selectedMember.id, 'slack_dnd')}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>🔕 Enable Slack DND</span>
                </button>
                <button 
                  onClick={() => handleManualIntervention(selectedMember.id, 'decline_meetings')}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5 text-red-400" />
                  <span>📅 Decline Meetings</span>
                </button>
                <button 
                  onClick={() => handleManualIntervention(selectedMember.id, 'manager_alert')}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-pink-400" />
                  <span>👔 Notify Manager</span>
                </button>
                <button 
                  onClick={() => handleManualIntervention(selectedMember.id, 'sprint_reduce')}
                  className="col-span-2 bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>📋 Reduce Sprint Load (Notify PM)</span>
                </button>
              </div>
            </div>

            {/* Intervention History */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-3">📜 Recent Interventions</h3>
              {selectedMember.recent_interventions.length === 0 ? (
                <div className="text-zinc-500 text-xs py-2">No interventions recorded for this member.</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {selectedMember.recent_interventions.map((ri, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-900 text-zinc-300 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{ri}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
