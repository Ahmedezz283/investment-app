import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investmentRequestsApi, usersApi, departmentsApi } from '../api/client';
import { InvestmentRequest, InvestmentRequestStatus, RiskLevel } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  PlusCircle,
  Building2,
  Users,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, dbUser } = useAuth();
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    investmentRequestsApi
      .getAll()
      .then((data) => setRequests(data))
      .catch((err) => console.error('Failed to load investment requests:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalRequests = requests.length;
  const inProgress = requests.filter(
    (r) =>
      r.status === InvestmentRequestStatus.IN_PROGRESS ||
      r.status === InvestmentRequestStatus.PENDING_APPROVAL
  ).length;
  const approved = requests.filter((r) => r.status === InvestmentRequestStatus.APPROVED).length;
  const rejected = requests.filter((r) => r.status === InvestmentRequestStatus.REJECTED).length;

  const totalCapital = requests.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const highRiskCount = requests.filter((r) => r.riskLevel === RiskLevel.HIGH).length;
  const medRiskCount = requests.filter((r) => r.riskLevel === RiskLevel.MEDIUM).length;
  const lowRiskCount = requests.filter((r) => r.riskLevel === RiskLevel.LOW).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-800/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              BPMN & GoRules Orchestration Live
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {dbUser?.name || user?.name || user?.username || 'Investor'} 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Monitor your investment pipeline, review multi-department approval gates, and track Flowable BPMN workflow tasks in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/investments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Investment Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Applications
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">{totalRequests}</div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{approved} approved</span> •{' '}
            <span className="text-rose-400 font-semibold">{rejected} rejected</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Review / Workflow
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-indigo-300">{inProgress}</div>
          <div className="mt-2 text-xs text-slate-400">
            Awaiting Flowable tasks & approvals
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Capital Volume
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-emerald-400">
            ${totalCapital.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Cumulative across all requests
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Risk Breakdown
            </span>
            <div className="p-2.5 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-rose-950/80 text-rose-300 text-xs font-bold rounded-lg border border-rose-800">
              {highRiskCount} High
            </span>
            <span className="px-2 py-1 bg-amber-950/80 text-amber-300 text-xs font-bold rounded-lg border border-amber-800">
              {medRiskCount} Med
            </span>
            <span className="px-2 py-1 bg-emerald-950/80 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800">
              {lowRiskCount} Low
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Evaluated by GoRules Engine
          </div>
        </div>
      </div>

      {/* Recent Investment Requests */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Investment Pipeline</h2>
            <p className="text-xs text-slate-400">Latest submissions and active BPMN lifecycle items</p>
          </div>
          <Link
            to="/investments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading investment requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            <FolderKanbanIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No investment requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Submit your first investment application to trigger GoRules & Flowable BPMN</p>
            <Link
              to="/investments"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" /> Create Request
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-xl">Company</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Risk Level</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">BPMN Instance</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.slice(0, 6).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-4 font-semibold text-slate-200">
                      {req.companyName}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-emerald-400">
                      ${Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge risk={req.riskLevel} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {req.flowableProcessInstanceId ? (
                        <span className="text-slate-300 font-semibold bg-slate-800 px-2 py-1 rounded">
                          #{req.flowableProcessInstanceId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/investments/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Inspect
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function FolderKanbanIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      <path d="M8 10v4"/>
      <path d="M12 10v2"/>
      <path d="M16 10v6"/>
    </svg>
  );
}

