'use client';

import { Phase } from '@/lib/types';
import { PHASE_INSTRUCTIONS } from '@/lib/utils';

interface PhaseIndicatorProps {
  phase: Phase;
  className?: string;
}

const PHASE_COLORS: Record<Phase, string> = {
  'lobby': 'bg-gray-100 text-gray-700 border-gray-300',
  'phase1': 'bg-blue-100 text-blue-800 border-blue-300',
  'phase2': 'bg-purple-100 text-purple-800 border-purple-300',
  'vote1': 'bg-orange-100 text-orange-800 border-orange-300',
  'vote2': 'bg-orange-100 text-orange-800 border-orange-300',
  'done': 'bg-green-100 text-green-800 border-green-300',
};

export default function PhaseIndicator({ phase, className = '' }: PhaseIndicatorProps) {
  const info = PHASE_INSTRUCTIONS[phase];
  const colorClass = PHASE_COLORS[phase];

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClass} ${className}`}>
      <div className="text-lg font-bold">{info.title}</div>
      <div className="text-sm mt-1 opacity-80">{info.instruction}</div>
    </div>
  );
}
