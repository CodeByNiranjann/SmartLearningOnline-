import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchStudentQuizzes, fetchCourses } from '../../services/api';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Play,
  RotateCcw,
  Search,
  BookOpen,
  Filter,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  XCircle,
  Compass,
} from 'lucide-react';

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, passed, not_attempted, attempts_left

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchStudentQuizzes({ search });
      setQuizzes(data?.quizzes || []);
    } catch (err) {
      console.error('Error fetching student quizzes:', err);
      setError(err.response?.data?.message || 'Failed to load quizzes from your enrolled courses.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (filterStatus === 'passed') return q.hasPassed;
      if (filterStatus === 'not_attempted') return q.attemptsUsed === 0;
      if (filterStatus === 'attempts_left') return q.canAttempt && !q.hasPassed;
      return true;
    });
  }, [quizzes, filterStatus]);

  // Overall metric counters
  const stats = useMemo(() => {
    const total = quizzes.length;
    const passed = quizzes.filter((q) => q.hasPassed).length;
    const attempted = quizzes.filter((q) => q.attemptsUsed > 0).length;
    const avgScore =
      attempted > 0
        ? Math.round(
            quizzes
              .filter((q) => typeof q.bestScore === 'number')
              .reduce((acc, q) => acc + q.bestScore, 0) / (quizzes.filter((q) => typeof q.bestScore === 'number').length || 1)
          )
        : 0;

    return { total, passed, attempted, avgScore };
  }, [quizzes]);

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* ─── Hero Header Banner ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment & Mastery Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              My Course Quizzes
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Validate your conceptual understanding, earn passing scores, and track your
              evaluations across all enrolled courses.
            </p>
          </div>

          <Link
            to="/courses"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 font-bold text-xs shadow-lg shadow-black/10 hover:bg-blue-50 transition-all whitespace-nowrap self-start md:self-auto"
          >
            <CompassIcon className="w-4 h-4" />
            <span>Browse More Courses</span>
          </Link>
        </div>

        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500">Available Quizzes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.passed}</div>
            <div className="text-xs font-medium text-slate-500">Passed Quizzes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.attempted}</div>
            <div className="text-xs font-medium text-slate-500">Quizzes Attempted</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats.avgScore > 0 ? `${stats.avgScore}%` : 'N/A'}
            </div>
            <div className="text-xs font-medium text-slate-500">Average Best Score</div>
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filters ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Quizzes</option>
            <option value="passed">Passed</option>
            <option value="attempts_left">Attempts Remaining</option>
            <option value="not_attempted">Not Attempted</option>
          </select>
        </div>
      </div>

      {/* ─── Alerts ─── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* ─── Quizzes Cards Grid ─── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your course quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-16 px-6 bg-white rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Quizzes Found</h3>
            <p className="text-sm text-slate-500">
              {quizzes.length === 0
                ? 'You are either not enrolled in any courses with active quizzes yet, or all enrolled courses have no published quizzes.'
                : 'No quizzes match your selected filter. Try changing your search or filter settings.'}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredQuizzes.map((quiz) => {
            const courseTitle = quiz.courseId?.title || 'Course Assessment';
            const isCompleted = quiz.hasPassed;
            const hasAttemptsLeft = quiz.canAttempt;
            const isResume = Boolean(quiz.inProgressAttemptId);

            return (
              <div
                key={quiz._id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 truncate max-w-xs">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{courseTitle}</span>
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Passed ({quiz.bestScore}%)
                      </span>
                    ) : quiz.attemptsUsed > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Best: {quiz.bestScore}% (Pass: {quiz.passingScore}%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        Pass Threshold: {quiz.passingScore}%
                      </span>
                    )}

                    {isResume && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Key Metadata Pill Details */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div className="text-slate-400 font-medium">Questions</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {quiz.questionCount}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div className="text-slate-400 font-medium">Time Limit</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : 'None'}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div className="text-slate-400 font-medium">Attempts</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {quiz.attemptsUsed} / {quiz.maxAttempts > 0 ? quiz.maxAttempts : '∞'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {hasAttemptsLeft
                      ? quiz.maxAttempts > 0
                        ? `${quiz.maxAttempts - quiz.attemptsUsed} attempt(s) remaining`
                        : 'Unlimited attempts'
                      : 'No attempts remaining'}
                  </span>

                  <button
                    onClick={() => navigate(`/student/quizzes/${quiz._id}`)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      isResume
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : hasAttemptsLeft
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isResume ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Quiz</span>
                      </>
                    ) : hasAttemptsLeft ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{quiz.attemptsUsed > 0 ? 'Retake Quiz' : 'Start Quiz'}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Subtle icon fallback
const CompassIcon = ({ className }) => <Compass className={className} />;

export default StudentQuizzes;
