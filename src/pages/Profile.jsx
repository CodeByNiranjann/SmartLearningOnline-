import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchStudentProgress } from '../services/api';
import { User, Mail, Shield, Calendar, Trophy, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesStarted: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    overallProgress: 0,
  });

  useEffect(() => {
    const loadProfileStats = async () => {
      try {
        const data = await fetchStudentProgress();
        if (data && data.summary) {
          setStats(data.summary);
        }
      } catch (err) {
        console.error('Error loading profile stats:', err);
      }
    };
    loadProfileStats();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-3xl font-extrabold uppercase shadow-xl shadow-indigo-500/20">
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-bold text-white">{user?.name || 'Student Name'}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 capitalize">
                {user?.role || 'student'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>{user?.email || 'student@example.com'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Joined Platform 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Stats Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Learning Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 w-fit text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses Started</p>
            <p className="text-2xl font-extrabold text-white">{stats.coursesStarted || 0}</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses Completed</p>
            <p className="text-2xl font-extrabold text-white">{stats.coursesCompleted || 0}</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 w-fit text-purple-400 border border-purple-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lessons Completed</p>
            <p className="text-2xl font-extrabold text-white">{stats.lessonsCompleted || 0}</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="p-2.5 rounded-xl bg-pink-500/10 w-fit text-pink-400 border border-pink-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Progress</p>
            <p className="text-2xl font-extrabold text-white">{stats.overallProgress || 0}%</p>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Account & Platform Security
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your account is secured with JWT authorization headers and encrypted password hashing using bcrypt. All progress data is synchronized with MongoDB.
        </p>
      </div>
    </div>
  );
};

export default Profile;
