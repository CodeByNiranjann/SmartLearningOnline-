import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentAchievements } from '../../services/api';
import {
  Award, CheckCircle2, Star, Calendar, RefreshCw, AlertCircle,
  FileText, HelpCircle, Trophy, BookOpen, ArrowRight, ShieldCheck
} from 'lucide-react';

const StudentAchievements = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchStudentAchievements();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load achievements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'course_completed':
        return <Trophy className="w-6 h-6 text-amber-500" />;
      case 'quiz_passed':
        return <HelpCircle className="w-6 h-6 text-purple-500" />;
      case 'task_graded':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default:
        return <Award className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'course_completed':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'quiz_passed':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'task_graded':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" /> My Achievements & Badges
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Milestones, completed courses, passed quizzes, and graded tasks.
            </p>
          </div>
          <button
            onClick={loadAchievements}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Earned</span>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{data.summary?.total || 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Done</span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{data.summary?.completedCourses || 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quizzes Passed</span>
                <HelpCircle className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{data.summary?.passedQuizzes || 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks Graded</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{data.summary?.gradedTasks || 0}</div>
            </div>
          </div>
        )}

        {/* List of achievements */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : !data || data.achievements?.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-700 mb-1">No Achievements Yet</h3>
            <p className="text-sm text-slate-500 mb-5">
              Complete lessons, pass quizzes, or submit tasks to unlock your first achievement!
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              Start Learning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.achievements.map((ach, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex items-start gap-4"
              >
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0">
                  {getAchievementIcon(ach.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(ach.type)}`}>
                      {ach.type === 'course_completed' && 'Course Completion'}
                      {ach.type === 'quiz_passed' && 'Quiz Master'}
                      {ach.type === 'task_graded' && 'Practical Task'}
                    </span>
                    {ach.earnedAt && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ach.earnedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                    {ach.title}
                  </h3>
                  {ach.courseName && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Course: <span className="font-medium text-slate-700">{ach.courseName}</span>
                    </p>
                  )}
                  {ach.type === 'quiz_passed' && (
                    <div className="mt-2 text-xs font-semibold text-purple-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-purple-500" />
                      Score: {ach.score}/{ach.maxScore} ({ach.percentage}%)
                    </div>
                  )}
                  {ach.type === 'task_graded' && (
                    <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Score: {ach.score}/{ach.maxPoints} pts
                      {ach.feedback && (
                        <span className="font-normal text-slate-500 truncate ml-1">
                          — {ach.feedback}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAchievements;
