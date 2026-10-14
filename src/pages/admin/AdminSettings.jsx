import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Shield,
  Server,
  KeyRound,
  CheckCircle,
  Database,
  Lock,
  Users,
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const [sessionTimeout] = useState('7 Days');
  const [twoFactorPolicy, setTwoFactorPolicy] = useState('optional');
  const [success, setSuccess] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess('Security settings updated successfully.');
    setTimeout(() => setSuccess(''), 3500);
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Platform Settings & Security
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review system parameters, role capabilities, and active authentication policies.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* System Health */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          System & Engine Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium">Database</span>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Database className="w-4 h-4" /> Connected (MongoDB)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium">Authentication</span>
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <KeyRound className="w-4 h-4" /> JWT + Session ID
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium">Session Lifetime</span>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Lock className="w-4 h-4 text-slate-500" /> {sessionTimeout}
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          Authentication & Access Policies
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Two-Factor Authentication (2FA) Policy</label>
            <select
              value={twoFactorPolicy}
              onChange={(e) => setTwoFactorPolicy(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="optional">Optional for All Users</option>
              <option value="mandatory_admin">Mandatory for Instructors & Admins</option>
              <option value="mandatory_all">Mandatory for All Accounts</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Save Policies
          </button>
        </div>
      </form>

      {/* Role Capabilities Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          Role Capabilities Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Permission / Capability</th>
                <th className="py-2.5 px-3 text-center">Student</th>
                <th className="py-2.5 px-3 text-center">Instructor</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold">Browse Courses & Learning Paths</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Track Progress & Resume Lessons</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Create & Manage Own Courses</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Manage Any Course / Cascade Deletion</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Promote / Demote User Roles</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
