import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchExercises } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  Layers,
  FileCheck,
  Send,
  Loader2,
  FileText,
  UploadCloud,
  Briefcase,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

const DIFFICULTY_BADGES = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const TYPE_ICONS = {
  'Coding Exercise': Code2,
  'Text Answer': FileText,
  'File Upload': UploadCloud,
  'Project Task': Briefcase,
};

const STATUS_BADGES = {
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Needs Revision': 'bg-rose-50 text-rose-700 border-rose-200',
};

const PracticalExercises = () => {
  const { user, isAuthenticated } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchExercises();
      setExercises(data.exercises || []);
    } catch (err) {
      console.error('Failed to load practical exercises:', err);
      setError('Unable to load exercises. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.courseId?.title && ex.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDiff = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
    const matchesType = selectedType === 'All' || ex.exerciseType === selectedType;

    let matchesStatus = true;
    const status = ex.mySubmission?.submissionStatus || 'Not Started';
    if (selectedStatus === 'Accepted') matchesStatus = status === 'Accepted';
    else if (selectedStatus === 'Submitted') matchesStatus = status === 'Submitted' || status === 'Under Review';
    else if (selectedStatus === 'In Progress') matchesStatus = status === 'In Progress';
    else if (selectedStatus === 'Not Started') matchesStatus = !ex.mySubmission;

    return matchesSearch && matchesDiff && matchesType && matchesStatus;
  });

  const totalCount = exercises.length;
  const acceptedCount = exercises.filter((e) => e.mySubmission?.submissionStatus === 'Accepted').length;
  const inProgressCount = exercises.filter((e) => e.mySubmission?.submissionStatus === 'In Progress').length;
  const submittedCount = exercises.filter(
    (e) => e.mySubmission?.submissionStatus === 'Submitted' || e.mySubmission?.submissionStatus === 'Under Review'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Hero Header ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-8 sm:p-12 shadow-xl mb-10 border border-slate-800">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Sprint 2 • Practical Learning & Exercises
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Hands-On Practical Exercises
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              Reinforce course topics through structured coding exercises, algorithmic problems, file audits, and written tasks evaluated directly by your instructors.
            </p>

            {/* Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-white">{totalCount}</span>
                <span className="text-xs text-slate-300 font-medium">Available Tasks</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-blue-300">
                  {isAuthenticated ? inProgressCount : '4 Types'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isAuthenticated ? 'In Progress' : 'Coding & Uploads'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-amber-300">
                  {isAuthenticated ? submittedCount : 'Instant'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isAuthenticated ? 'Under Review' : 'Code Submissions'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-emerald-300">
                  {isAuthenticated ? acceptedCount : '100%'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isAuthenticated ? 'Accepted & Passed' : 'Instructor Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Search & Filters Bar ─── */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises, concepts, or courses..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Difficulty:</span>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Types & Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Type Selector */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Type:</span>
              {['All', 'Coding Exercise', 'File Upload', 'Text Answer', 'Project Task'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedType === type
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Student Status Filter */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">My Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Exercises</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted / Reviewing</option>
                  <option value="Accepted">Accepted & Passed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ─── Exercise Cards Grid ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading practical exercises...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8">
            <Code2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Exercises Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
              Try adjusting your search criteria or clear filters to see more tasks.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDifficulty('All');
                setSelectedType('All');
                setSelectedStatus('All');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((ex) => {
              const submission = ex.mySubmission;
              const status = submission?.submissionStatus || 'Not Started';
              const Icon = TYPE_ICONS[ex.exerciseType] || Code2;
              const isAccepted = status === 'Accepted';

              return (
                <div
                  key={ex._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                        {ex.exerciseType}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                          DIFFICULTY_BADGES[ex.difficulty] || 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {ex.difficulty}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {ex.title}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {ex.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        ~{ex.estimatedMinutes} mins
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Trophy className="w-3.5 h-3.5" />
                        {ex.maximumMarks} Marks
                      </span>
                    </div>

                    {/* Linked Course & Lesson */}
                    {ex.courseId && (
                      <div className="text-[11px] text-slate-500 mb-3 truncate">
                        Course:{' '}
                        <span className="font-semibold text-slate-700">{ex.courseId.title}</span>
                        {ex.lessonId && (
                          <span className="text-slate-400 block truncate">
                            Lesson: {ex.lessonId.title}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action & Status */}
                  <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <div>
                      {submission ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                            STATUS_BADGES[status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isAccepted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {status}: {submission.marksAwarded !== null ? `${submission.marksAwarded}m` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Pass mark: {ex.passingMarks}m
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/exercises/${ex._id}`}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        isAccepted
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : submission
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                      }`}
                    >
                      {submission ? 'View Task' : 'Start Task'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticalExercises;
