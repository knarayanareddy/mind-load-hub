'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  cl_score: number;
  alert_level: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'BURNOUT';
  burnout_risk_pct: number;
  in_flow_state: boolean;
}

interface HeatMapProps {
  data: TeamMember[];
  onMemberClick?: (id: string) => void;
}

// Spec-defined color palette for each alert level
const SPEC_COLORS: Record<string, string> = {
  OPTIMAL: '#00ff88',
  MODERATE: '#ffcc00',
  HIGH: '#ff8800',
  CRITICAL: '#ff4444',
  BURNOUT: '#ff0066',
};

// Derive glow intensity and animation class from alert level
function getGlowStyle(level: string, score: number): React.CSSProperties {
  switch (level) {
    case 'OPTIMAL':
      return { boxShadow: `0 0 ${8 + score * 0.1}px rgba(0,255,136,0.15), inset 0 0 3px rgba(0,255,136,0.05)` };
    case 'MODERATE':
      return { boxShadow: `0 0 ${10 + score * 0.15}px rgba(255,204,0,0.2), inset 0 0 4px rgba(255,204,0,0.08)` };
    case 'HIGH':
      return { boxShadow: `0 0 ${12 + score * 0.2}px rgba(255,136,0,0.28), inset 0 0 5px rgba(255,136,0,0.12)` };
    case 'CRITICAL':
      return { boxShadow: `0 0 ${16 + score * 0.25}px rgba(255,68,68,0.45), inset 0 0 8px rgba(255,68,68,0.2)` };
    case 'BURNOUT':
      return { boxShadow: `0 0 ${20 + score * 0.3}px rgba(255,0,102,0.6), inset 0 0 10px rgba(255,0,102,0.25)` };
    default:
      return {};
  }
}

function getPulseClass(level: string): string {
  if (level === 'CRITICAL') return 'heatmap-cell-critical';
  if (level === 'BURNOUT') return 'heatmap-cell-burnout';
  return '';
}

// D3 mini bar component rendered inside each cell
function MiniScoreBar({ score, color }: { score: number; color: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const w = ref.current.clientWidth || 120;
    const h = 6;
    svg.attr('width', w).attr('height', h);

    // Background track
    svg.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', w).attr('height', h)
      .attr('rx', 3)
      .attr('fill', 'rgba(255,255,255,0.06)');

    // Fill
    svg.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 0).attr('height', h)
      .attr('rx', 3)
      .attr('fill', color)
      .transition().duration(800).ease(d3.easeCubicOut)
      .attr('width', Math.max(8, (score / 100) * w));
  }, [score, color]);

  return <svg ref={ref} className="w-full" style={{ height: 6 }} />;
}

export function HeatMap({ data, onMemberClick }: HeatMapProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-8 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {data.map((member) => {
        const color = SPEC_COLORS[member.alert_level] || '#888';
        const glowStyle = getGlowStyle(member.alert_level, member.cl_score);
        const pulseClass = getPulseClass(member.alert_level);

        return (
          <button
            key={member.id}
            onClick={() => onMemberClick?.(member.id)}
            className={`heatmap-cell ${pulseClass} rounded-2xl p-4 flex flex-col gap-3 text-left cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none`}
            style={{
              background: `${color}08`,
              border: `1px solid ${color}30`,
              ...glowStyle,
            }}
            aria-label={`${member.name}: ${member.cl_score} cognitive load score, ${member.alert_level}`}
          >
            {/* Score bubble */}
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                style={{ background: `${color}18`, color }}
              >
                {Math.round(member.cl_score)}
              </div>
              {member.in_flow_state && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#00e5ff18', color: '#00e5ff', border: '1px solid #00e5ff30' }}
                  title="Protected Flow State"
                >
                  🌊 FLOW
                </span>
              )}
            </div>

            {/* Name & role */}
            <div>
              <p className="font-semibold text-white text-sm leading-tight truncate">{member.name}</p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{member.role}</p>
            </div>

            {/* Score progress bar */}
            <MiniScoreBar score={member.cl_score} color={color} />

            {/* Alert level badge */}
            <div className="flex items-center justify-between">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
              >
                {member.alert_level}
              </span>
              {member.burnout_risk_pct > 50 && (
                <span
                  className="text-[9px] font-bold"
                  style={{ color: '#ff4444' }}
                >
                  🔥 {Math.round(member.burnout_risk_pct)}%
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
