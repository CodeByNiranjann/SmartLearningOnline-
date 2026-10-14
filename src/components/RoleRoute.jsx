import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * RoleRoute — protects routes behind both authentication AND role checks.
 *
 * Usage in App.jsx:
 *   <Route element={<RoleRoute allowedRoles={['instructor', 'admin']} />}>
 *     <Route path="/manage/courses" element={<MyCourses />} />
 *   </Route>
 */
const RoleRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → show access-denied page
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl border border-rose-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 max-w-md w-full text-center space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 w-fit mx-auto">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500">
            You do not have permission to access this page.
            This area is restricted to{' '}
            <strong className="text-slate-700">{allowedRoles.join(' or ')}</strong> accounts.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleRoute;
