import React, { useState, useEffect } from 'react';
import { departmentsApi, usersApi } from '../api/client';
import { Department, User } from '../types';
import { Modal } from '../components/Modal';
import {
  Building2,
  Plus,
  UserPlus,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Department Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign User Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, userList] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.getAll(),
      ]);
      setDepartments(depts);
      setUsers(userList);
      if (depts.length > 0) setSelectedDeptId(depts[0].id);
      if (userList.length > 0) setSelectedUserId(userList[0].id);
    } catch (err) {
      console.error('Failed to load department data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await departmentsApi.create({ name, description });
      setMessage({ type: 'success', text: `Department "${name}" created successfully!` });
      setName('');
      setDescription('');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to create department.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !selectedUserId) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await departmentsApi.assignUser(selectedDeptId, selectedUserId);
      setMessage({ type: 'success', text: 'User successfully assigned to department!' });
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to assign user to department.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;

    try {
      await departmentsApi.delete(id);
      setMessage({ type: 'success', text: `Department "${name}" deleted.` });
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to delete department.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Departments</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage approval gate departments and member allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Assign User</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Department</span>
          </button>
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
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading departments...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl">
          <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-slate-200 text-base">No departments configured</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Departments participate in BPMN approval chains and receive investment evaluation tasks.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const memberCount = users.filter((u) => u.departmentId === dept.id).length;
            return (
              <div
                key={dept.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{dept.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          UUID: {dept.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-4 line-clamp-2">
                    {dept.description || 'Enterprise department reviewing investment criteria and approvals.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>{memberCount} assigned user{memberCount === 1 ? '' : 's'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDeptId(dept.id);
                      setIsAssignModalOpen(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Assign User
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Department"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Department Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Risk Management, Legal, Finance"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe department responsibilities and review authority..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign User to Department"
      >
        <form onSubmit={handleAssignUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Target Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) — Current Dept: {u.department?.name || 'None'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Assign User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

