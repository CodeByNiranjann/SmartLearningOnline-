import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User, Menu, X, LayoutDashboard, Compass, GraduationCap, ShieldCheck, Settings, Sparkles, Briefcase, Code2, Target } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, protected: true },
    { name: 'Courses', path: '/courses', icon: Compass, protected: false },
    { name: 'Resources', path: '/resources', icon: BookOpen, protected: false },
    { name: 'Projects', path: '/internship-projects', icon: Briefcase, protected: false },
    { name: 'Coding Arena', path: '/coding-challenges', icon: Code2, protected: false },
    { name: 'Skill Tracks', path: '/skill-learning', icon: Target, protected: true },
    { name: 'My Learning', path: '/my-learning', icon: GraduationCap, protected: true },
    { name: 'Profile & 2FA', path: '/profile', icon: User, protected: true },
    // Management links — only Admin has Manage Settings; Instructors have Instructor Hub
    ...(user?.role === 'admin'
      ? [
          { name: 'Admin Console', path: '/admin/dashboard', icon: ShieldCheck, protected: true },
          { name: 'Manage Settings', path: '/admin/settings', icon: Settings, protected: true },
        ]
      : user?.role === 'instructor'
      ? [
          { name: 'Instructor Hub', path: '/instructor/dashboard', icon: Sparkles, protected: true },
        ]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LearnHub Brand Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/courses'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                LearnHub
              </span>
              <span className="block text-[10px] text-blue-600 font-semibold tracking-wider uppercase -mt-1">
                Student Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Section / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name.charAt(0) : 'S'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                    {user?.name || 'Student'}
                  </span>
                  {user?.isTwoFactorEnabled && (
                    <span title="2FA Protected" className="text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Log out of account"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            if (link.protected && !isAuthenticated) return null;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                  {user?.name ? user.name.charAt(0) : 'S'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-white bg-blue-600 font-semibold text-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
