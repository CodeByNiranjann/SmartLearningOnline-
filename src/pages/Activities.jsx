import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchActivities } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Search,
  Filter,
  Clock,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  Play,
  RotateCcw,
} from 'lucide-react';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const DIFFICULTY_COLORS = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const Activities = () => {
  const { user, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'in_progress' | 'completed' | 'not_started'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchActivities();
        setActivities(res.activities || []);
      } catch (err) {
        console.error('Failed to load activities:', err);
        setError('Failed to load project-based activities');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = activities.filter((act) => {
    const matchesSearch =
      !search.trim() ||
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.description.toLowerCase().includes(search.toLowerCase()) ||
      act.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
      act.category.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === 'All' || act.difficulty === difficultyFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'not_started' && (!act.studentStatus || act.studentStatus === 'not_started')) ||
      act.studentStatus === statusFilter;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hands-on Engineering Practice</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Project-Based Activities
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Apply theoretical knowledge to solve real-world problems. Complete milestones, submit source code and live demos, and receive personalized trainer feedback.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities by title, course, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                Difficulty: {d}
              </option>
            ))}
          </select>

          {isAuthenticated && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All">All Progress</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="not_started">Not Started</option>
            </select>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Activities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No project activities match your criteria</p>
          <p className="text-xs text-slate-400">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((act) => {
            const hasStarted = act.studentStatus && act.studentStatus !== 'not_started';
            const isCompleted = act.studentStatus === 'completed';
            const isSubmitted = act.studentStatus === 'submitted';
            const needsRevision = act.studentStatus === 'needs_revision';

            return (
              <div
                key={act._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-blue-300 transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Category & Difficulty */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {act.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        DIFFICULTY_COLORS[act.difficulty] || DIFFICULTY_COLORS.Intermediate
                      }`}
                    >
                      {act.difficulty}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link
                      to={`/activities/${act._id}`}
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {act.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  {/* Course Badge */}
                  {act.course && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{act.course.title}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {act.technologyStack?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {act.technologyStack.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          {t}
                        </span>
                      ))}
                      {act.technologyStack.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{act.technologyStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.estimatedDuration || '4h'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.maximumMarks} Marks</span>
                    </div>
                  </div>
                </div>

                {/* Progress / Status & CTA */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {isAuthenticated && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Your Status:</span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                          <Clock className="w-3.5 h-3.5" /> Under Review
                        </span>
                      ) : needsRevision ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <RotateCcw className="w-3.5 h-3.5" /> Needs Revision
                        </span>
                      ) : hasStarted ? (
                        <span className="font-semibold text-blue-600">
                          In Progress ({act.overallProgress || 0}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Started</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/activities/${act._id}`}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/activities/${act._id}/workspace`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span>{hasStarted ? 'Workspace' : 'Start'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Activities;
