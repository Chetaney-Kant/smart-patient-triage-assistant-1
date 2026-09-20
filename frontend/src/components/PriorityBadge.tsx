import React from 'react';
import { TriagePriority } from '../types';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TriagePriority | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', showIcon = true }) => {
  const p = (priority || '').toUpperCase();

  let bg = 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
  let icon = <HelpCircle className="w-4 h-4 mr-1.5" />;
  let label = 'INSUFFICIENT INFO';

  if (p === 'EMERGENCY') {
    bg = 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800 animate-pulse';
    icon = <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600 dark:text-red-400" />;
    label = 'EMERGENCY';
  } else if (p === 'URGENT') {
    bg = 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800';
    icon = <AlertCircle className="w-4 h-4 mr-1.5 text-orange-600 dark:text-orange-400" />;
    label = 'URGENT';
  } else if (p === 'NORMAL' || p === 'ROUTINE') {
    bg = 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
    icon = <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />;
    label = 'ROUTINE / NORMAL';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-sm font-bold',
    lg: 'px-4 py-1.5 text-base font-extrabold shadow-sm',
  }[size];

  return (
    <span className={`inline-flex items-center justify-center rounded-full border ${bg} ${sizeClasses}`}>
      {showIcon && icon}
      {label}
    </span>
  );
};
