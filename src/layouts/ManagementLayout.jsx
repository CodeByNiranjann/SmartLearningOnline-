import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  UserCheck,
  User,
  Code2,
  FolderGit2,
} from 'lucide-react';

const ManagementLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const roleTitle = isAdmin ? 'Admin Console' : 'Instructor Hub';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin navigation items
  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Instructors', path: '/admin/instructors', icon: UserCheck },
    { name: 'All Courses', path: '/manage/courses', icon: BookOpen },
    { name: 'Modules & Lessons', path: '/admin/curriculum', icon: Layers },
    { name: 'Project Activities', path: '/manage/activities', icon: Sparkles },
    { name: 'Practical Exercises', path: '/manage/exercises', icon: Code2 },
    { name: 'Real-World Projects', path: '/manage/projects', icon: FolderGit2 },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { name: 'Manage Settings', path: '/admin/settings', icon: Settings },
  ];

  // Instructor navigation items
  const instructorNav = [
    { name: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/manage/courses', icon: BookOpen },
    { name: 'Modules', path: '/instructor/modules', icon: Layers },
    { name: 'Lessons', path: '/instructor/lessons', icon: FileText },
    { name: 'Project Activities', path: '/manage/activities', icon: Sparkles },
    { name: 'Practical Exercises', path: '/manage/exercises', icon: Code2 },
    { name: 'Real-World Projects', path: '/manage/projects', icon: FolderGit2 },
    { name: 'My Students', path: '/instructor/students', icon: GraduationCap },
    { name: 'Progress & Reports', path: '/instructor/reports', icon: BarChart3 },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const navigationItems = isAdmin ? adminNav : instructorNav;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white text-slate-800">
      {/* ─── Mobile Top Header ─── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <Link to={isAdmin ? '/admin/dashboard' : '/instructor/dashboard'} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">LearnHub</span>
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-600 -mt-0.5">
              {roleTitle}
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle management navigation"
          aria-expanded={mobileOpen}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ─── Sidebar Overlay (Mobile) ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar (Desktop & Mobile Drawer) ─── */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/instructor/dashboard'}
              className="flex items-center gap-3 group"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">LearnHub</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-blue-600">
                  <Shield className="w-3 h-3" />
                  {roleTitle}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="px-3 py-4 space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Management Menu
            </p>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isMatch = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive || isMatch
                        ? 'bg-blue-50 text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {(isMatch || location.pathname === item.path) && (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer controls: Back to Student portal, User info, Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link
            to="/courses"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Student Portal</span>
            </span>
            <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600">
              Switch
            </span>
          </Link>

          <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/70 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out of management session"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Canvas ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-700 capitalize">{user?.role} Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isAdmin
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {user?.role} Mode
            </span>
            <Link
              to="/courses"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View As Student</span>
            </Link>
          </div>
        </header>

        {/* Routed views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagementLayout;
