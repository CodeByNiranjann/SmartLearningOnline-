import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const StudentLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* LearnHub Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LearnHub Education Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Security & 2FA</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Help & Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
