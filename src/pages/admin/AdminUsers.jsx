import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAdminUsers, updateUserRole, deleteUser, createInstructor } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Shield,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  X,
  Plus,
} from 'lucide-react';

const AdminUsers = ({ defaultRoleFilter = 'all' }) => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryRole = searchParams.get('role') || defaultRoleFilter;
  const [roleFilter, setRoleFilter] = useState(queryRole);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Instructor modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Role change modal
  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('student');
  const [roleSaving, setRoleSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // User detail modal
  const [detailTarget, setDetailTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;

      const data = await fetchAdminUsers(params);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    try {
      setRoleSaving(true);
      setError('');
      setSuccess('');
      const res = await updateUserRole(roleTarget._id, selectedNewRole);
      setSuccess(res.message || 'User role successfully updated.');
      setRoleTarget(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setError('');
      setSuccess('');
      const res = await deleteUser(deleteTarget._id);
      setSuccess(res.message || 'User successfully removed.');
      setDeleteTarget(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError('Name, email, and password are required.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError('');
      setError('');
      setSuccess('');
      const res = await createInstructor(createForm);
      setSuccess(res.message || 'Instructor account created successfully.');
      setCreateForm({ name: '', email: '', password: '' });
      setShowCreateModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create instructor.');
    } finally {
      setCreateLoading(false);
    }
  };

  const roleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'instructor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'student':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {roleFilter === 'instructor' ? 'Instructor Directory' : 'User Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage account permissions, promote instructors, audit enrolled learners, and manage access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCreateForm({ name: '', email: '', password: '' });
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Instructor
          </button>
          <button
            onClick={loadUsers}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Filter & Search Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setSearchParams(e.target.value === 'all' ? {} : { role: e.target.value });
            }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* ─── Users Table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400">Try modifying your search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Activity</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {u.role === 'student' ? (
                          <span>{u.enrolledCount} enrolled courses</span>
                        ) : (
                          <span>{u.coursesTaught} courses authored</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Role change button */}
                          <button
                            onClick={() => {
                              setRoleTarget(u);
                              setSelectedNewRole(u.role);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Change Role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button (cannot delete self) */}
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Role Change Modal ─── */}
      {roleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Change User Role
              </h3>
              <button
                onClick={() => setRoleTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Modify permissions for <strong className="text-slate-900">{roleTarget.name}</strong> (
              {roleTarget.email}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Assign Role:
              </label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="student">Student (Standard learner access)</option>
                <option value="instructor">Instructor (Can author and manage own courses)</option>
                <option value="admin">Administrator (Full platform & user control)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRoleTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={roleSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {roleSaving ? 'Saving...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="p-3 bg-rose-50 rounded-xl w-fit text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Delete User Account</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800">{deleteTarget.name}</strong> ({deleteTarget.email})?
                This action cannot be undone and will revoke all sessions.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Instructor Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Create Instructor Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Only platform administrators can create Instructor accounts. Instructors can author courses, organize curriculum modules, and manage their assigned students.
            </p>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInstructor} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Alan Turing"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alan@learnhub.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
