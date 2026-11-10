'use client';

import { useState } from 'react';
import type { User, UserRole } from '@/db/schema';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface UserManagerProps {
  initialUsers: User[];
  currentUserId?: string;
}

export function UserManager({ initialUsers, currentUserId }: UserManagerProps) {
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'student' as UserRole,
    active: true,
    registrationNo: '',
    designation: '',
    department: 'Prosthetic & Orthotic Sciences',
    semester: '',
    batchYear: '',
    password: '',
  });

  const refreshUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter !== '') params.set('active', activeFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.users)) {
            setUsersList(data.users);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setMessage({ type: 'success', text: `Account for ${data.fullName} created and synced to DB successfully.` });
      setShowCreateModal(false);

      // Instantly prepend new user to local state
      setUsersList((prev) => [data, ...prev.filter((u) => u.id !== data.id)]);

      setNewUserData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        role: 'student',
        active: true,
        registrationNo: '',
        designation: '',
        department: 'Prosthetic & Orthotic Sciences',
        semester: '',
        batchYear: '',
        password: '',
      });
      refreshUsers();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Creation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (currentUserId && editingUser.id === currentUserId && editingUser.active === false) {
      setMessage({ type: 'error', text: 'You cannot disable your own active admin account.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          phone: editingUser.phone,
          role: editingUser.role,
          active: editingUser.active,
          registrationNo: editingUser.registrationNo,
          designation: editingUser.designation,
          department: editingUser.department,
          semester: editingUser.semester,
          batchYear: editingUser.batchYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setMessage({ type: 'success', text: `Account for ${editingUser.fullName} updated successfully.` });
      setUsersList((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      setEditingUser(null);
      refreshUsers();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (currentUserId && user.id === currentUserId) {
      setMessage({ type: 'error', text: 'You cannot disable your own active admin account.' });
      return;
    }

    setMessage(null);
    const newActiveState = !user.active;

    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: newActiveState } : u))
    );

    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActiveState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status toggle failed');

      setMessage({
        type: 'success',
        text: `User ${user.fullName} is now ${data.active ? 'Active (Portal Access Granted)' : 'Disabled (Portal Access Revoked)'}.`,
      });
      refreshUsers();
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: user.active } : u))
      );
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to toggle status' });
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Are you sure you want to trigger a password reset for ${user.fullName}?`)) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setMessage({ type: 'success', text: data.message });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Reset failed' });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (currentUserId && user.id === currentUserId) {
      setMessage({ type: 'error', text: 'You cannot delete your own active admin account.' });
      return;
    }

    if (!confirm(`Are you sure you want to PERMANENTLY delete ${user.fullName}? This cannot be undone.`)) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setMessage({ type: 'success', text: 'User deleted successfully.' });
      setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      refreshUsers();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.registrationNo && u.registrationNo.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchRole = !roleFilter || u.role === roleFilter;
    const matchActive = activeFilter === '' || (activeFilter === 'true' ? u.active : !u.active);

    return matchSearch && matchRole && matchActive;
  });

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium border ${message.type === 'success'
            ? 'bg-brand-success-bg text-brand-success border-brand-success-border'
            : 'bg-brand-danger-bg text-brand-danger border-brand-danger-border'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Action and Filter Bar */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, email, or reg no..."
                className="w-full rounded-lg border border-brand-border-default bg-brand-page pl-9 pr-3 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="student">Student</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="">All Statuses</option>
              <option value="true">Active (Access Granted)</option>
              <option value="false">Disabled (Locked Out)</option>
            </select>
          </form>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-subtle text-brand-text-muted uppercase tracking-wider font-semibold border-b border-brand-border-default">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Registration / Designation</th>
                <th className="px-6 py-3.5">Portal Access Status</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-default">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-brand-subtle/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-brand-text-primary">{u.fullName}</div>
                    <div className="text-[11px] text-brand-text-muted">@{u.username} • {u.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize border ${u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300'
                        : u.role === 'supervisor'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'bg-brand-success-bg text-brand-success border-brand-success-border'
                        }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-text-secondary">
                    {u.registrationNo && <div>Reg: {u.registrationNo}</div>}
                    {u.designation && <div>{u.designation}</div>}
                    {!u.registrationNo && !u.designation && '—'}
                  </td>
                  <td className="px-6 py-4">
                    {currentUserId && u.id === currentUserId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-brand-success-bg text-brand-success border border-brand-success-border">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                        <span>Active (You)</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all shadow-xs cursor-pointer ${u.active
                          ? 'bg-brand-success-bg text-brand-success border border-brand-success-border hover:bg-brand-danger-bg hover:text-brand-danger hover:border-brand-danger-border'
                          : 'bg-brand-danger-bg text-brand-danger border border-brand-danger-border hover:bg-brand-success-bg hover:text-brand-success hover:border-brand-success-border'
                          }`}
                        title={u.active ? 'Click to Disable / Lock out' : 'Click to Activate / Grant Portal Access'}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-brand-danger" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-brand-text-muted">{u.department || 'PIPOS'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-subtle hover:text-brand-text-primary transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-warning-bg hover:text-brand-warning transition-colors"
                        title="Trigger Password Reset"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {(!currentUserId || u.id !== currentUserId) && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-danger-bg hover:text-brand-danger transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-brand-page p-6 shadow-xl border border-brand-border-default max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-white font-bold text-xs">
                +
              </div>
              <h3 className="text-base font-bold text-brand-text-primary">
                Create & Sync New PIPOS Account
              </h3>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Full Name <span className="text-brand-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    placeholder="e.g. Dr. Ayesha Khan"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Username <span className="text-brand-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="ayesha_khan"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Email Address <span className="text-brand-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="ayesha@pipos.edu.pk"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Role <span className="text-brand-danger">*</span>
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  >
                    <option value="student">Student</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Portal Access Status <span className="text-brand-danger">*</span>
                  </label>
                  <select
                    value={newUserData.active ? 'true' : 'false'}
                    onChange={(e) => setNewUserData({ ...newUserData, active: e.target.value === 'true' })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  >
                    <option value="true">Active (Allow Portal Access)</option>
                    <option value="false">Disabled (Block Portal Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Registration No (Students)
                  </label>
                  <input
                    type="text"
                    value={newUserData.registrationNo}
                    onChange={(e) => setNewUserData({ ...newUserData, registrationNo: e.target.value })}
                    placeholder="PIPOS-2023-014"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Designation (Supervisors/Staff)
                  </label>
                  <input
                    type="text"
                    value={newUserData.designation}
                    onChange={(e) => setNewUserData({ ...newUserData, designation: e.target.value })}
                    placeholder="Senior Clinical Prosthetist"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={newUserData.semester}
                    onChange={(e) => setNewUserData({ ...newUserData, semester: e.target.value })}
                    placeholder="6"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    value={newUserData.batchYear}
                    onChange={(e) => setNewUserData({ ...newUserData, batchYear: e.target.value })}
                    placeholder="2022-2026"
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-text-secondary mb-1">
                  Temporary Password (Optional)
                </label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Defaults to CaseFlow2026!"
                  className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-brand-border-default bg-brand-page px-4 py-2 text-xs font-semibold text-brand-text-secondary hover:bg-brand-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-brand-accent px-4 py-2 text-xs font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating & Syncing...' : 'Create & Sync Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-brand-page p-6 shadow-xl border border-brand-border-default max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-brand-text-primary mb-4">
              Edit Account: {editingUser.fullName}
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Portal Access Status
                  </label>
                  <select
                    value={editingUser.active ? 'true' : 'false'}
                    disabled={Boolean(currentUserId && editingUser.id === currentUserId)}
                    onChange={(e) => setEditingUser({ ...editingUser, active: e.target.value === 'true' })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  >
                    <option value="true">Active (Portal Access Allowed)</option>
                    <option value="false">Disabled (Portal Access Revoked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  >
                    <option value="student">Student</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Registration No
                  </label>
                  <input
                    type="text"
                    value={editingUser.registrationNo || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, registrationNo: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editingUser.designation || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={editingUser.semester || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, semester: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text-secondary mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    value={editingUser.batchYear || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, batchYear: e.target.value })}
                    className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border-default">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-brand-border-default bg-brand-page px-4 py-2 text-xs font-semibold text-brand-text-secondary hover:bg-brand-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-brand-accent px-4 py-2 text-xs font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
