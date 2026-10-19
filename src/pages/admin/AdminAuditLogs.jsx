import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminAuditLogs } from '../../services/api';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit,
      };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (targetTypeFilter !== 'all') params.targetType = targetTypeFilter;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await fetchAdminAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.response?.data?.message || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, targetTypeFilter, search, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const handleResetFilters = () => {
    setActionFilter('all');
    setTargetTypeFilter('all');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'USER_DEACTIVATED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">User Deactivated</span>;
      case 'USER_ACTIVATED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">User Activated</span>;
      case 'USER_ROLE_UPDATED':
      case 'USER_ROLE_AND_STATUS_UPDATED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">Role Changed</span>;
      case 'QUIZ_SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Quiz Attempt</span>;
      case 'TASK_GRADED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">Task Graded</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Audit Trail & Compliance Logs</h1>
              <p className="text-sm text-slate-400">
                Tamper-resistant, append-only record of administrative actions, account changes, and assessments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Logged Events</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Immutable records stored</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Account Actions</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.action?.startsWith('USER_')).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Status and role changes in current page</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Assessment Submissions</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.action === 'QUIZ_SUBMITTED' || l.action === 'TASK_GRADED').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Quizzes and practical tasks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Security Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">Active</div>
          <div className="text-xs text-slate-400 mt-1">Strict password omission enforced</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, email, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Action Types</option>
              <option value="USER_DEACTIVATED">User Deactivated</option>
              <option value="USER_ACTIVATED">User Activated</option>
              <option value="USER_ROLE_UPDATED">Role Changed</option>
              <option value="QUIZ_SUBMITTED">Quiz Submitted</option>
              <option value="TASK_GRADED">Task Graded</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Targets</option>
              <option value="User">User Accounts</option>
              <option value="QuizAttempt">Quiz Attempts</option>
              <option value="TaskSubmission">Task Submissions</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={handleResetFilters}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700/40 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Actor</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Target</th>
                <th className="py-3.5 px-4 font-semibold">Justification / Reason</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No audit log events match the specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-500 ml-5">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{log.actor?.name || log.actorEmail || 'System'}</div>
                      <div className="text-xs text-slate-400">{log.actorEmail || 'N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <span className="font-semibold text-slate-200">{log.targetType}</span>
                      {log.targetId && (
                        <div className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                          {log.targetId}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {log.reason ? (
                        <span className="text-slate-300 italic line-clamp-2">
                          "{log.reason}"
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No reason logged</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/20 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

          {/* Pagination Controls */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing page {page} of {totalPages} ({total} total logs)</span>
            <span className="text-slate-600">|</span>
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs font-semibold">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Audit Event Inspection</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedLog._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Actor</span>
                  <span className="text-white font-medium">{selectedLog.actorEmail || 'System'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Action Type</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Target</span>
                  <span className="text-white font-medium">{selectedLog.targetType} ({selectedLog.targetId || 'N/A'})</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Logged IP / User Agent</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate block">{selectedLog.ip || '127.0.0.1'}</span>
                </div>
              </div>

              {/* Justification */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
                <span className="text-indigo-400 font-semibold block mb-1">Justification Reason</span>
                <p className="text-slate-200 italic">{selectedLog.reason || 'None provided.'}</p>
              </div>

              {/* Before & After State Comparison */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">State Transition</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-rose-400 font-semibold block mb-2">Before</span>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : 'null (Created)'}
                    </pre>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-2">After</span>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : 'null (Deleted)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
