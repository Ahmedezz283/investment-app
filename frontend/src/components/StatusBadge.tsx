import React from 'react';
import { InvestmentRequestStatus, RiskLevel } from '../types';

interface StatusBadgeProps {
  status?: InvestmentRequestStatus | string;
  risk?: RiskLevel | string | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, risk, className = '' }) => {
  if (risk) {
    let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';
    if (risk === RiskLevel.LOW || risk === 'LOW') {
      colorStyles = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
    } else if (risk === RiskLevel.MEDIUM || risk === 'MEDIUM') {
      colorStyles = 'bg-amber-950/70 text-amber-400 border-amber-800/80';
    } else if (risk === RiskLevel.HIGH || risk === 'HIGH') {
      colorStyles = 'bg-rose-950/70 text-rose-400 border-rose-800/80';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
        {risk} RISK
      </span>
    );
  }

  if (status) {
    let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';
    if (status === InvestmentRequestStatus.APPROVED || status === 'APPROVED') {
      colorStyles = 'bg-emerald-950/80 text-emerald-400 border-emerald-700';
    } else if (status === InvestmentRequestStatus.REJECTED || status === 'REJECTED') {
      colorStyles = 'bg-rose-950/80 text-rose-400 border-rose-700';
    } else if (
      status === InvestmentRequestStatus.IN_PROGRESS ||
      status === 'IN_PROGRESS' ||
      status === InvestmentRequestStatus.PENDING_APPROVAL ||
      status === 'PENDING_APPROVAL'
    ) {
      colorStyles = 'bg-indigo-950/80 text-indigo-300 border-indigo-700 animate-pulse';
    } else if (status === InvestmentRequestStatus.COMPLETED || status === 'COMPLETED') {
      colorStyles = 'bg-cyan-950/80 text-cyan-300 border-cyan-700';
    } else if (status === InvestmentRequestStatus.DRAFT || status === 'DRAFT') {
      colorStyles = 'bg-slate-800 text-slate-400 border-slate-700';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
        {status.toString().replace('_', ' ')}
      </span>
    );
  }

  return null;
};

