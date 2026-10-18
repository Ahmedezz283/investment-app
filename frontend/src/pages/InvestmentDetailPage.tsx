import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  investmentRequestsApi,
  approvalsApi,
  departmentsApi,
} from '../api/client';
import {
  InvestmentRequest,
  FlowableTask,
  UserApproval,
  ApprovalDecision,
  Department,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Building,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  GitPullRequest,
  Check,
  User as UserIcon,
  Play,
  Layers,
} from 'lucide-react';

export const InvestmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();

  const [request, setRequest] = useState<InvestmentRequest | null>(null);
  const [tasks, setTasks] = useState<FlowableTask[]>([]);
  const [processInfo, setProcessInfo] = useState<any>(null);
  const [approvals, setApprovals] = useState<UserApproval[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Complete Task Modal
  const [selectedTask, setSelectedTask] = useState<FlowableTask | null>(null);
  const [taskApproved, setTaskApproved] = useState(true);
  const [taskComments, setTaskComments] = useState('');

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<ApprovalDecision>(ApprovalDecision.APPROVED);
  const canRecordDecision = (dbUser?.role ?? user?.role ?? '').trim().toLowerCase() !== 'investor';

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [reqData, tasksData, procData, approvalsData, deptsData] =
        await Promise.allSettled([
          investmentRequestsApi.getById(id),
          investmentRequestsApi.getTasks(id),
          investmentRequestsApi.getProcess(id),
          approvalsApi.getForRequest(id),
          departmentsApi.getAll(),
        ]);

      if (reqData.status === 'fulfilled') setRequest(reqData.value);
      if (tasksData.status === 'fulfilled') setTasks(tasksData.value || []);
      if (procData.status === 'fulfilled') setProcessInfo(procData.value);
      if (approvalsData.status === 'fulfilled') setApprovals(approvalsData.value || []);
      if (deptsData.status === 'fulfilled') setDepartments(deptsData.value);
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, dbUser]);

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canRecordDecision) return;
    setActionLoading(true);
    setMessage(null);

    try {
      await approvalsApi.recordDecision(id, decisionType);
      setMessage({ type: 'success', text: `Decision recorded: ${decisionType}` });
      setIsDecisionModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to record decision. Ensure user has a department.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    setMessage(null);

    try {
      await investmentRequestsApi.completeTask(selectedTask.id, [
        { name: 'approved', value: taskApproved, type: 'boolean' },
        { name: 'comments', value: taskComments, type: 'string' },
      ]);
      setMessage({ type: 'success', text: `Flowable Task "${selectedTask.name}" completed successfully.` });
      setSelectedTask(null);
      setTaskComments('');
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to complete task in Flowable BPMN.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !request) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading investment workflow details...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-200">Investment Request Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">The requested investment ID does not exist in the database.</p>
        <Link
          to="/investments"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/investments')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{request.companyName}</h1>
              <StatusBadge status={request.status} />
              <StatusBadge risk={request.riskLevel} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Request UUID: {request.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {canRecordDecision && (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Record Department Decision</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Funding Requested</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400 font-mono">
            ${Number(request.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Created: {new Date(request.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Risk Assessment</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge risk={request.riskLevel} />
            <span className="text-xs text-slate-300 font-medium">Evaluated by GoRules</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Updated: {new Date(request.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Flowable BPMN Engine</span>
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 font-mono text-sm text-slate-200">
            {request.flowableProcessInstanceId ? (
              <span className="px-2.5 py-1 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded-lg inline-block">
                Instance #{request.flowableProcessInstanceId}
              </span>
            ) : (
              <span className="text-slate-400">No active instance</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Active Tasks: <span className="text-emerald-400 font-bold">{tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Flowable Tasks & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active BPMN Tasks */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Flowable Active Tasks</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-xs font-bold rounded-full border border-indigo-800">
              {tasks.length} pending
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-10 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              <Check className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No pending workflow tasks</p>
              <p className="text-xs text-slate-400 mt-1">All BPMN steps are completed or awaiting asynchronous triggers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-200">{task.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Task ID: {task.id} {task.taskDefinitionKey && `• Key: ${task.taskDefinitionKey}`}
                    </div>
                    {task.createTime && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Created: {new Date(task.createTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedTask(task)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-950/40 transition-all flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Complete Task</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Approvals Log */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Department Decisions & Audits</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-full border border-slate-700">
              {approvals.length} recorded
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="py-10 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No department decisions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Use the "Record Department Decision" button above to log approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((appr) => {
                const isApproved = appr.decision === ApprovalDecision.APPROVED;
                return (
                  <div
                    key={appr.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <span>{appr.user?.name || `User (${appr.userId.slice(0, 8)}...)`}</span>
                        <span className="text-xs text-slate-400">
                          in {appr.department?.name || `Dept (${appr.departmentId.slice(0, 8)}...)`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(appr.decidedAt).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isApproved
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : 'bg-rose-950/80 text-rose-300 border-rose-700'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {appr.decision}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Record Decision Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="Record Department Approval Decision"
      >
        <form onSubmit={handleRecordDecision} className="space-y-4">
          <p className="text-xs text-slate-300">
            Log an official review decision on behalf of a department member for this investment request.
          </p>

          <p className="text-xs text-slate-400">
            This decision will be recorded under your authenticated account.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecisionType(ApprovalDecision.APPROVED)}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  decisionType === ApprovalDecision.APPROVED
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>APPROVE</span>
              </button>

              <button
                type="button"
                onClick={() => setDecisionType(ApprovalDecision.REJECTED)}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  decisionType === ApprovalDecision.REJECTED
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>REJECT</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Task Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Complete Flowable Task: ${selectedTask?.name || ''}`}
      >
        <form onSubmit={handleCompleteTask} className="space-y-4">
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300">
            Completing this task will advance the <strong>Flowable BPMN 2.0</strong> execution graph.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Task Variable: "approved"
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="approved"
                  checked={taskApproved === true}
                  onChange={() => setTaskApproved(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>true (Approve / Continue)</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="approved"
                  checked={taskApproved === false}
                  onChange={() => setTaskApproved(false)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>false (Reject / Terminate)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Review Comments / Notes
            </label>
            <textarea
              rows={3}
              value={taskComments}
              onChange={(e) => setTaskComments(e.target.value)}
              placeholder="e.g. Risk analysis verified, compliance passed."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {actionLoading ? 'Advancing BPMN...' : 'Complete Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

