import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchExerciseById,
  submitExercise,
  getExerciseSubmissionFileUrl,
  getExerciseAttachmentUrl,
  enrollCourse,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  UploadCloud,
  Send,
  Trophy,
  Sparkles,
  Layers,
  BookOpen,
  RotateCcw,
  User,
  Calendar,
  MessageSquare,
  FileCode,
  Download,
  History,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  Loader2,
  Play,
  Terminal,
  Copy,
  Trash2,
  FolderGit2,
  Paperclip,
  CheckSquare,
} from 'lucide-react';

const DIFFICULTY_BADGES = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_BADGES = {
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-purple-50 text-purple-700 border-purple-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Needs Revision': 'bg-rose-50 text-rose-700 border-rose-200',
};

const ExerciseDetails = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [exercise, setExercise] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form inputs
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Instructions accordion
  const [showInstructions, setShowInstructions] = useState(true);

  // Accordion for previous attempt history
  const [expandedAttempts, setExpandedAttempts] = useState({});

  // ─── Code Execution & Output State ───────────────────────────────────────────
  const [runOutput, setRunOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadExerciseDetails();
  }, [exerciseId]);

  const loadExerciseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchExerciseById(exerciseId);
      setExercise(data.exercise);
      setSubmission(data.mySubmission || null);
      setIsEnrolled(Boolean(data.isEnrolled));

      if (data.mySubmission?.textAnswer) {
        setTextAnswer(data.mySubmission.textAnswer);
      } else if (data.exercise?.starterCode) {
        setTextAnswer(data.exercise.starterCode);
      } else if (data.exercise?.exerciseType === 'Coding Exercise') {
        setTextAnswer(
          '// Type or paste your code solution here...\nfunction solution() {\n  console.log("Running exercise solution...");\n  return true;\n}\n'
        );
      }
    } catch (err) {
      console.error('Failed to load exercise details:', err);
      setError(err.response?.data?.message || 'Could not retrieve practical exercise.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollNow = async () => {
    try {
      setEnrolling(true);
      setActionError('');
      const courseId = exercise.courseId?._id || exercise.courseId;
      await enrollCourse(courseId);
      setIsEnrolled(true);
      setActionSuccess('Successfully enrolled in course! You can now submit your work.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to enroll in course.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds the 10 MB limit. Please select a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // ─── Run Code in Browser Context ───────────────────────────────────────────
  const handleRunCode = () => {
    if (!textAnswer.trim()) {
      setRunOutput({
        status: 'error',
        logs: ['// No code entered to execute. Write code and click "Run Code".'],
        result: null,
        executionTime: 0,
      });
      return;
    }

    setIsRunning(true);
    const logs = [];
    const customConsole = {
      log: (...args) =>
        logs.push(
          args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
        ),
      info: (...args) => logs.push('ℹ ' + args.map((a) => String(a)).join(' ')),
      warn: (...args) => logs.push('⚠ ' + args.map((a) => String(a)).join(' ')),
      error: (...args) => logs.push('✖ ' + args.map((a) => String(a)).join(' ')),
    };

    const startTime = performance.now();
    try {
      // Execute the code safely in a scoped Function wrapper
      const runFn = new Function(
        'console',
        `
        ${textAnswer}
        if (typeof solution === 'function') {
          return solution();
        }
      `
      );
      const res = runFn(customConsole);
      const elapsed = Math.round(performance.now() - startTime);

      setRunOutput({
        status: 'success',
        logs: logs.length > 0 ? logs : ['Code executed successfully with no console output.'],
        result:
          res !== undefined
            ? typeof res === 'object'
              ? JSON.stringify(res, null, 2)
              : String(res)
            : null,
        executionTime: elapsed,
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setRunOutput({
        status: 'error',
        logs: logs,
        error: err.toString(),
        executionTime: elapsed,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = () => {
    if (!textAnswer) return;
    navigator.clipboard.writeText(textAnswer);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleResetStarterCode = () => {
    if (exercise?.starterCode) {
      setTextAnswer(exercise.starterCode);
    } else {
      setTextAnswer(
        '// Write your solution here\nfunction solution() {\n  return true;\n}\n'
      );
    }
  };

  const handleSubmit = async (saveAsDraft = false) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const canSubmit = isEnrolled || user?.role === 'admin' || user?.role === 'instructor';
    if (!canSubmit) {
      setActionError('You must be enrolled in this course to submit answers for this exercise.');
      return;
    }

    setActionError('');
    setActionSuccess('');

    // Validation for final submission
    if (!saveAsDraft) {
      if (exercise.exerciseType === 'Coding Exercise' || exercise.exerciseType === 'Text Answer') {
        if (!textAnswer || !textAnswer.trim()) {
          setActionError('Please provide your solution before submitting.');
          return;
        }
      } else if (exercise.exerciseType === 'File Upload') {
        if (!selectedFile && !submission?.fileReference) {
          setActionError('Please select a file to upload before submitting.');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      let payload;

      if (selectedFile) {
        payload = new FormData();
        payload.append('file', selectedFile);
        if (textAnswer) payload.append('textAnswer', textAnswer);
        if (saveAsDraft) payload.append('saveAsDraft', 'true');
      } else {
        payload = {
          textAnswer: textAnswer.trim(),
          saveAsDraft,
        };
      }

      const res = await submitExercise(exerciseId, payload);
      setSubmission(res.submission);
      setSelectedFile(null);
      setActionSuccess(res.message || 'Submission successfully recorded!');
    } catch (err) {
      console.error('Submission failed:', err);
      setActionError(err.response?.data?.message || 'Failed to submit exercise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttemptAccordion = (idx) => {
    setExpandedAttempts((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading practical exercise instructions...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen py-16 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Exercise Unavailable</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'This exercise cannot be accessed.'}</p>
          <Link
            to="/exercises"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Practical Exercises
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = submission ? submission.submissionStatus : 'Not Started';
  const isAccepted = currentStatus === 'Accepted';
  const needsRevision = currentStatus === 'Needs Revision';
  const lineCount = textAnswer.split('\n').length;
  const canSubmit = isEnrolled || user?.role === 'admin' || user?.role === 'instructor';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Breadcrumb Navigation ─── */}
        <div className="flex items-center justify-between">
          <Link
            to="/exercises"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Practical Exercises
          </Link>

          {exercise.courseId && (
            <Link
              to={`/courses/${exercise.courseId._id || exercise.courseId}`}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              Course: <strong className="text-slate-700">{exercise.courseId.title || 'Course Details'}</strong>
            </Link>
          )}
        </div>

        {/* ─── Exercise Header Banner ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  {exercise.exerciseType}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    DIFFICULTY_BADGES[exercise.difficulty] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {exercise.difficulty}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{exercise.estimatedMinutes} mins
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  {exercise.maximumMarks} Points (Pass: {exercise.passingMarks})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {exercise.title}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
                {exercise.description}
              </p>
            </div>

            {/* Status Pill Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shrink-0 min-w-[200px] flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Submission Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    STATUS_BADGES[currentStatus] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {currentStatus}
                </span>
                {submission?.attemptNumber && (
                  <span className="text-xs text-slate-500 font-medium">
                    Attempt #{submission.attemptNumber}
                  </span>
                )}
              </div>

              {submission?.marksAwarded !== null && submission?.marksAwarded !== undefined && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Marks:</span>
                  <span
                    className={`font-extrabold text-sm ${
                      submission.marksAwarded >= exercise.passingMarks ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {submission.marksAwarded} / {exercise.maximumMarks} Pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Feedback Alerts ─── */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ─── Collapsible Task Instructions & Learning Objectives ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Task Instructions & Objectives</h2>
                <p className="text-xs text-slate-500">
                  Click to {showInstructions ? 'collapse' : 'view'} detailed requirements, step-by-step guidance, and reference links.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {showInstructions && (
            <div className="p-6 sm:p-8 pt-0 border-t border-slate-100 space-y-6">
              <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-200 font-sans text-xs sm:text-sm">
                {exercise.instructions}
              </div>

              {/* Core Objectives */}
              {exercise.learningObjectives?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Core Learning Objectives:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {exercise.learningObjectives.map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Links & Lab Kit */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {exercise.experimentFile?.originalName && (
                  <a
                    href={getExerciseAttachmentUrl(exercise._id)}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Starter Kit ({exercise.experimentFile.originalName})</span>
                  </a>
                )}

                {exercise.referenceMaterials?.map((mat, idx) => (
                  <a
                    key={idx}
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-blue-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{mat.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── LARGE & HALF-SCREEN INTERACTIVE CODING & EXECUTION RESULT WORKSPACE ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Interactive Implementation & Execution</h2>
                <p className="text-xs text-slate-500">
                  Write your code solution on the left (pure white letters). Click "Run Code" to view live results on the right.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetStarterCode}
                title="Reset to starter template"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Code</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy code to clipboard"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* ─── 50/50 SPLIT: LEFT HALF (CODE EDITOR) & RIGHT HALF (EXECUTION RESULT) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ─── LEFT HALF: LARGE CODE EDITOR (WHITE LETTERS) ─── */}
            <div className="flex flex-col rounded-2xl bg-[#090d16] border border-slate-800 shadow-md overflow-hidden min-h-[480px]">
              {/* Editor Header Bar */}
              <div className="px-4 py-2.5 bg-[#0e1422] border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 ml-2 font-semibold">
                    Solution.js / Code
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                  <span>•</span>
                  <span>UTF-8</span>
                </div>
              </div>

              {/* Editor Body: Line numbers + Pure White Text Textarea */}
              <div className="relative flex-1 flex overflow-hidden">
                {/* Line Numbers Column */}
                <div className="w-12 py-4 select-none font-mono text-xs text-slate-600 text-right pr-3 bg-[#070b13] border-r border-slate-800/50">
                  {Array.from({ length: Math.max(lineCount, 16) }).map((_, i) => (
                    <div key={i} className="leading-relaxed">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Textarea with PURE WHITE LETTERS */}
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="// Type or paste your code solution here in JavaScript / Python / Code..."
                  spellCheck={false}
                  style={{
                    color: '#ffffff',
                    caretColor: '#ffffff',
                    backgroundColor: '#090d16',
                  }}
                  className="w-full h-full p-4 font-mono text-sm leading-relaxed text-white caret-white resize-none focus:outline-none placeholder:text-slate-500 selection:bg-blue-600 selection:text-white border-0"
                />
              </div>

              {/* Editor Footer / Run Button Bar */}
              <div className="px-4 py-3 bg-[#0e1422] border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  ECMAScript 6+ / Browser Engine
                </span>

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Code & View Result</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ─── RIGHT HALF: HALF-SCREEN LIVE RESULT & OUTPUT TERMINAL ─── */}
            <div className="flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-md overflow-hidden min-h-[480px]">
              {/* Terminal Header */}
              <div className="px-4 py-2.5 bg-[#0e1422] border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-[11px] font-bold text-slate-200">
                    Execution Output & Test Result
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {runOutput && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        runOutput.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {runOutput.status === 'success' ? 'Passed / Output OK' : 'Runtime Error'}
                    </span>
                  )}
                  {runOutput && (
                    <button
                      type="button"
                      onClick={() => setRunOutput(null)}
                      title="Clear output terminal"
                      className="text-slate-400 hover:text-slate-200 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-4">
                {runOutput ? (
                  <>
                    {/* Execution Meta Pill */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Execution Time: <strong className="text-slate-200">{runOutput.executionTime}ms</strong>
                      </span>
                      <span className="text-emerald-400 font-semibold">Ready for Review</span>
                    </div>

                    {/* Console Output Logs */}
                    <div className="space-y-1.5">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block">
                        Console Logs:
                      </span>
                      <div className="p-3.5 rounded-xl bg-[#070b13] border border-slate-800 text-slate-200 space-y-1 overflow-x-auto whitespace-pre-wrap">
                        {runOutput.logs.map((log, i) => (
                          <div key={i} className="text-emerald-300">
                            <span className="text-slate-500 mr-2">&gt;</span>
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Returned Value from solution() */}
                    {runOutput.result !== null && (
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block">
                          Function Return Value:
                        </span>
                        <div className="p-3.5 rounded-xl bg-[#070b13] border border-emerald-900/40 text-emerald-300 font-bold overflow-x-auto whitespace-pre-wrap">
                          {runOutput.result}
                        </div>
                      </div>
                    )}

                    {/* Error Details (if any) */}
                    {runOutput.error && (
                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-rose-400">
                          <AlertCircle className="w-4 h-4" />
                          Execution Exception:
                        </span>
                        <pre className="text-xs whitespace-pre-wrap overflow-x-auto text-rose-200">
                          {runOutput.error}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty state terminal */
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <Terminal className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="max-w-xs space-y-1">
                      <p className="font-bold text-slate-300 text-sm">Terminal Output Ready</p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Click the green <strong className="text-emerald-400">"▶ Run Code"</strong> button on the left to execute your code solution and inspect output here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Footer Info */}
              <div className="px-4 py-2.5 bg-[#0e1422] border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Output Console active</span>
                <span>Sandbox: Secure Scoped Runner</span>
              </div>
            </div>
          </div>

          {/* ─── File Attachment Section (Optional or for File Upload tasks) ─── */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                Attach Additional Solution File / Archive (Optional):
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Supported: .pdf, .txt, .zip, .js, .py (Max 10 MB)
              </span>
            </div>

            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 transition-colors">
              <input
                type="file"
                id="exercise-file-input"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.zip,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md"
              />
              <label htmlFor="exercise-file-input" className="cursor-pointer block text-center">
                <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-blue-600 hover:underline">
                  {selectedFile ? selectedFile.name : 'Click to browse or drop file'}
                </span>
                {selectedFile && (
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </label>
            </div>
            {fileError && <p className="text-xs text-rose-600">{fileError}</p>}

            {/* Currently uploaded file reference */}
            {submission?.fileReference && !selectedFile && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate mr-2">
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-600 font-medium">Uploaded file:</span>
                  <span className="font-bold text-slate-800 font-mono truncate">
                    {submission.fileReference.originalName}
                  </span>
                </div>
                <a
                  href={getExerciseSubmissionFileUrl(submission._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 font-semibold inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            )}
          </div>

          {/* ─── Enrollment Warning & Instant 1-Click Enrollment Action ─── */}
          {!canSubmit && isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="block font-bold">Enrollment required for final submission:</strong>
                <span>You are not yet enrolled in this course. Enroll with 1 click to submit your answer.</span>
              </div>
              <button
                type="button"
                disabled={enrolling}
                onClick={handleEnrollNow}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
              >
                {enrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Enroll in Course (Free)</span>
              </button>
            </div>
          )}

          {/* ─── Submission Bar (Save Draft & Submit) ─── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {submission?.submittedAt && (
                <span>Last submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !canSubmit}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !canSubmit}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Task...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{needsRevision ? 'Resubmit Solution' : 'Submit Task'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Submission History & Audit Trail ─── */}
        {submission?.history?.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Prior Attempt History ({submission.history.length})</h2>
            </div>
            <p className="text-xs text-slate-500">
              Complete audit trail of all previous submissions, timestamps, past grades, and reviewer comments.
            </p>

            <div className="space-y-3">
              {submission.history.map((past, idx) => {
                const isExpanded = !!expandedAttempts[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden text-xs"
                  >
                    <div
                      onClick={() => toggleAttemptAccordion(idx)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900">Attempt #{past.attemptNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            STATUS_BADGES[past.submissionStatus] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {past.submissionStatus}
                        </span>
                        {past.marksAwarded !== null && (
                          <span className="font-semibold text-emerald-700">
                            {past.marksAwarded} Marks
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>{new Date(past.submittedAt).toLocaleDateString()}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                        {past.textAnswer && (
                          <div>
                            <span className="font-bold text-slate-700 block mb-1">Submitted Answer:</span>
                            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                              {past.textAnswer}
                            </pre>
                          </div>
                        )}

                        {past.fileReference && (
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <span>Attached File: {past.fileReference.originalName}</span>
                            <span className="text-slate-400 font-medium">({Math.round(past.fileReference.size / 1024)} KB)</span>
                          </div>
                        )}

                        {past.reviewerFeedback && (
                          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900">
                            <span className="font-bold block mb-1">Instructor Review:</span>
                            <p className="leading-relaxed">{past.reviewerFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetails;
