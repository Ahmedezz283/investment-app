import React, { useState, useEffect } from 'react';
import { usersApi, authApi, departmentsApi } from '../api/client';
import { User, Department } from '../types';
import { Modal } from '../components/Modal';
import {
  Users as UsersIcon,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  Plus,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Search,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Assign Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('Investor');

  // Add Keycloak Role Modal
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userList, deptList] = await Promise.all([
        usersApi.getAll(),
        departmentsApi.getAll(),
      ]);
      setUsers(userList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authApi.assignRole(selectedUser.id, newRole);
      setMessage({
        type: 'success',
        text: `Role "${newRole}" successfully assigned to ${selectedUser.name}!`,
      });
      setIsRoleModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to assign role.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authApi.addRole(roleName, roleDesc);
      setMessage({
        type: 'success',
        text: `Role "${roleName}" created in Keycloak realm!`,
      });
      setRoleName('');
      setRoleDesc('');
      setIsAddRoleModalOpen(false);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to create role in Keycloak.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}"?`)) return;

    try {
      await usersApi.delete(id);
      setMessage({ type: 'success', text: `User "${name}" removed.` });
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to delete user.',
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.National_ID.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Users & Roles</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Keycloak identity mapping, department memberships, and role assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-colors"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Create Realm Role</span>
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

      {/* Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, or National ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            <UsersIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-xl">User Name</th>
                  <th className="px-4 py-3.5">National ID</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Keycloak ID</th>
                  <th className="px-4 py-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-100">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-300 tracking-wider">
                      {u.National_ID}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/70">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {u.department ? (
                        <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          {u.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {u.keycloakId ? `${u.keycloakId.slice(0, 10)}...` : '—'}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role || 'Investor');
                          setIsRoleModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete User"
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

      {/* Assign Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={`Assign Role to ${selectedUser?.name || 'User'}`}
      >
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Select Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Investor">Investor</option>
              <option value="Approver">Approver</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
              <option value="RiskOfficer">RiskOfficer</option>
              <option value="ComplianceAuditor">ComplianceAuditor</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Realm Role Modal */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Create Keycloak Realm Role"
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Role Name
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. RiskOfficer, Approver"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="Role responsibilities and permission scope..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddRoleModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Role in Keycloak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

