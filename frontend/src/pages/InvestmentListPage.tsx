import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { investmentRequestsApi, usersApi } from '../api/client';
import { InvestmentRequest, InvestmentRequestStatus, RiskLevel, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Building,
  ArrowUpRight,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

export const InvestmentListPage: React.FC = () => {
  const { user, dbUser } = useAuth();
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await investmentRequestsApi.getAll();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load investment requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    usersApi
      .getAll()
      .then((data) => {
        setUsers(data);
        if (dbUser?.id) {
          setSelectedInvestorId(dbUser.id);
        } else if (data.length > 0) {
          setSelectedInvestorId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load users:', err));
  }, [dbUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!companyName || !amount || Number(amount) <= 0) {
      setFormError('Please enter a valid company name and positive investment amount.');
      return;
    }

    if (!selectedInvestorId) {
      setFormError('Please select or register a valid investor account first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReq = await investmentRequestsApi.create({
        companyName,
        amount: Number(amount),
        investorId: selectedInvestorId,
      });

      setFormSuccess(`Investment request created! Evaluated risk: ${newReq.riskLevel || 'LOW'}`);
      setCompanyName('');
      setAmount('');
      fetchRequests();

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || 'Failed to create investment request. Verify backend & GoRules.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this investment request?')) {
      return;
    }

    try {
      await investmentRequestsApi.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete request.');
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || req.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Investment Requests</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Create, track, and orchestrate capital approval flows with Flowable & GoRules
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Status: All</option>
              <option value={InvestmentRequestStatus.DRAFT}>Draft</option>
              <option value={InvestmentRequestStatus.IN_PROGRESS}>In Progress</option>
              <option value={InvestmentRequestStatus.PENDING_APPROVAL}>Pending Approval</option>
              <option value={InvestmentRequestStatus.APPROVED}>Approved</option>
              <option value={InvestmentRequestStatus.REJECTED}>Rejected</option>
              <option value={InvestmentRequestStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-40">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Risk: All</option>
              <option value={RiskLevel.LOW}>Low Risk</option>
              <option value={RiskLevel.MEDIUM}>Medium Risk</option>
              <option value={RiskLevel.HIGH}>High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading applications...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            <DollarSign className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No matching investment requests</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || statusFilter !== 'ALL' || riskFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filter tags.'
                : 'Get started by creating your first investment request application.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-xl">Company</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Risk Level</th>
                  <th className="px-4 py-3.5">Workflow Status</th>
                  <th className="px-4 py-3.5">Flowable BPMN ID</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-100">{req.companyName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {req.id.slice(0, 8)}...</div>
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
                    <td className="px-4 py-4 font-mono text-xs">
                      {req.flowableProcessInstanceId ? (
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          #{req.flowableProcessInstanceId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-slate-400">Not started</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Link
                        to={`/investments/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-semibold transition-all border border-emerald-500/30"
                      >
                        Inspect
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={(e) => handleDelete(req.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Investment Application"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              Submitting triggers <strong>GoRules Decision Engine</strong> to evaluate risk and kicks off a <strong>Flowable BPMN process</strong> for department reviews.
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Target Company Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme FinTech Corp"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Investment Capital Amount ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1000"
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 250000"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Applicant / Investor Account
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                {users.length === 0 ? (
                  <option value="">No users found in database</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.National_ID}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/60 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Evaluating & Starting BPMN...</span>
                </>
              ) : (
                <>
                  <span>Submit & Trigger Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

