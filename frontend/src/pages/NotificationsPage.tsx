import React, { useState, useEffect } from 'react';
import { notificationsApi, investmentRequestsApi, usersApi } from '../api/client';
import { InvestmentRequest, User } from '../types';
import {
  BellRing,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Radio,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState<Array<{ time: string; type: string; details: string; status: 'ok' | 'err' }>>([]);

  useEffect(() => {
    investmentRequestsApi
      .getAll()
      .then((data) => {
        setRequests(data);
        if (data.length > 0) {
          setSelectedRequestId(data[0].id);
          setSelectedInvestorId(data[0].investorId);
        }
      })
      .catch(console.error);

    usersApi
      .getAll()
      .then((data) => setUsers(data))
      .catch(console.error);
  }, []);

  const handleSelectRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    const req = requests.find((r) => r.id === reqId);
    if (req) {
      setSelectedInvestorId(req.investorId);
    }
  };

  const triggerEvent = async (type: 'approval' | 'rejection' | 'missing-data') => {
    if (!selectedRequestId || !selectedInvestorId) {
      alert('Please select both an Investment Request and Investor UUID.');
      return;
    }

    setIsLoading(true);
    const now = new Date().toLocaleTimeString();

    try {
      let res;
      if (type === 'approval') {
        res = await notificationsApi.approval(selectedRequestId, selectedInvestorId);
      } else if (type === 'rejection') {
        res = await notificationsApi.rejection(selectedRequestId, selectedInvestorId);
      } else {
        res = await notificationsApi.missingData(selectedRequestId, selectedInvestorId);
      }

      setLog((prev) => [
        {
          time: now,
          type: type.toUpperCase(),
          details: `Dispatched to Kafka topic for request ${selectedRequestId.slice(0, 8)}... (investor ${selectedInvestorId.slice(0, 8)}...)`,
          status: 'ok',
        },
        ...prev,
      ]);
    } catch (err: any) {
      setLog((prev) => [
        {
          time: now,
          type: type.toUpperCase(),
          details: err?.response?.data?.message || 'Kafka broker notification dispatch failed',
          status: 'err',
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Kafka Notification Center</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Simulate and dispatch event-driven SMTP notifications via Kafka message broker
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
            <span>Event Dispatch Simulator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Target Investment Request
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => handleSelectRequest(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.companyName} (${Number(r.amount).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Investor UUID
              </label>
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.id.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold uppercase text-slate-300">
              Select Event Type to Publish:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => triggerEvent('approval')}
                disabled={isLoading}
                className="p-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 flex flex-col items-center text-center gap-2 transition-all group disabled:opacity-50"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-sm">Approval Event</div>
                  <div className="text-[11px] text-emerald-400/80">investment.approved</div>
                </div>
              </button>

              <button
                onClick={() => triggerEvent('rejection')}
                disabled={isLoading}
                className="p-4 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 flex flex-col items-center text-center gap-2 transition-all group disabled:opacity-50"
              >
                <XCircle className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-sm">Rejection Event</div>
                  <div className="text-[11px] text-rose-400/80">investment.rejected</div>
                </div>
              </button>

              <button
                onClick={() => triggerEvent('missing-data')}
                disabled={isLoading}
                className="p-4 rounded-2xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/80 text-amber-300 flex flex-col items-center text-center gap-2 transition-all group disabled:opacity-50"
              >
                <AlertTriangle className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-sm">Missing Data</div>
                  <div className="text-[11px] text-amber-400/80">investment.missing-data</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Log Stream */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Dispatched Event Stream</span>
            </div>
            <button
              onClick={() => setLog([])}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 mt-4 space-y-2.5 overflow-y-auto max-h-[350px]">
            {log.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No events triggered yet. Click one of the buttons on the left.
              </div>
            ) : (
              log.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    item.status === 'ok'
                      ? 'bg-slate-950/70 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{item.type}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.time}</span>
                  </div>
                  <div className="text-slate-300">{item.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

