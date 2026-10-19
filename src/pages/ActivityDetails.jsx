import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchActivityById, startActivity } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
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
  Check,
  Calendar,
  Layers,
  ListChecks,
  FileCheck,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const ActivityDetails = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activity, setActivity] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchActivityById(activityId);
        setActivity(res.activity);
        setMilestones(res.milestones || []);
        setAssignment(res.assignment || null);
        setLatestSubmission(res.latestSubmission || null);
      } catch (err) {
        console.error('Failed to load activity details:', err);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activityId]);

  const handleStartActivity = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setStarting(true);
      await startActivity(activityId);
      navigate(`/activities/${activityId}/workspace`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start activity');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm">Loading activity details...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-16 text-center space-y-3 font-sans">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-base font-bold text-slate-800">Activity not found</p>
        <Link to="/activities" className="text-xs text-blue-600 font-semibold hover:underline">
          Back to all activities
        </Link>
      </div>
    );
  }

  const hasStarted = Boolean(assignment);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link
          to="/activities"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-semibold text-slate-500">Back to Activities</span>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                DIFFICULTY_COLORS[activity.difficulty] || DIFFICULTY_COLORS.Intermediate
              }`}
            >
              {activity.difficulty}
            </span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {activity.category}
            </span>
            {activity.course && (
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{activity.course.title}</span>
              </span>
            )}
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-2">
            {hasStarted ? (
              <Link
                to={`/activities/${activity._id}/workspace`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStartActivity}
                disabled={starting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{starting ? 'Starting...' : 'Start Activity'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activity.title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {activity.description}
          </p>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Duration</span>
            <span className="text-xs font-bold text-slate-800">{activity.estimatedDuration || '4 hours'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Marks</span>
            <span className="text-xs font-bold text-slate-800">{activity.maximumMarks} (Pass: {activity.passingMarks})</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Milestones</span>
            <span className="text-xs font-bold text-slate-800">{milestones.length} tasks</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Due Date</span>
            <span className="text-xs font-bold text-slate-800">
              {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : 'Self-paced'}
            </span>
          </div>
        </div>
      </div>

      {/* Problem Statement Card */}
      {activity.problemStatement && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Problem Statement & Scenario</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {activity.problemStatement}
          </p>
        </div>
      )}

      {/* Learning Objectives & Technologies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectives */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Learning Objectives</span>
          </h3>
          <ul className="space-y-2">
            {activity.learningObjectives?.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack & Required Skills */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span>Tech Stack & Tools</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {activity.technologyStack?.map((t, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          <h4 className="text-xs font-semibold text-slate-500 pt-2 uppercase tracking-wider">
            Required Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {activity.requiredSkills?.map((s, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Instructions */}
      {activity.instructions && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Detailed Instructions & Specifications</span>
          </h3>
          <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {activity.instructions}
          </div>
        </div>
      )}

      {/* Ordered Milestones */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Milestone Roadmap ({milestones.length})</span>
        </h3>

        <div className="space-y-3">
          {milestones.map((m, idx) => (
            <div
              key={m._id || idx}
              className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 flex items-start gap-4"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {m.sequenceOrder || idx + 1}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                  {m.dueDate && (
                    <span className="text-[10px] font-semibold text-blue-600">
                      Due: {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {m.description && <p className="text-xs text-slate-600">{m.description}</p>}
                {m.completionRequirements && (
                  <p className="text-[11px] text-slate-500 italic">
                    Requirements: {m.completionRequirements}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grading Rubric */}
      {activity.gradingRubric?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>Grading Rubric</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Evaluation Criteria</th>
                  <th className="py-2.5 px-4 font-semibold">Expected Standard</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Max Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.gradingRubric.map((r, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.criteria}</td>
                    <td className="py-3 px-4 text-slate-600">{r.description || '—'}</td>
                    <td className="py-3 px-4 font-bold text-blue-600 text-right">{r.maxMarks} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom CTA Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Ready to build this project?</h3>
          <p className="text-xs text-slate-600">
            Open the student workspace to track milestones, test source code, and submit your deliverables.
          </p>
        </div>

        {hasStarted ? (
          <Link
            to={`/activities/${activity._id}/workspace`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all shrink-0"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleStartActivity}
            disabled={starting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{starting ? 'Starting...' : 'Start Activity'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityDetails;
