import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchStudentQuizDetails,
  startQuizAttempt,
  submitQuizAttempt,
  fetchAttemptResult,
  fetchQuizAttempts,
} from '../../services/api';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Award,
  BookOpen,
  Check,
  X,
  FileQuestion,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz & Attempt info
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // Active taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: { selectedOptionIndex, selectedOptions, textAnswer } }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed result state
  const [completedAttempt, setCompletedAttempt] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  // Auto-submit guard ref to prevent multiple timers firing
  const submittedRef = useRef(false);

  // Load Quiz Details and Start/Resume Attempt
  const initializeQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      submittedRef.current = false;

      // 1. Fetch metadata and questions
      const meta = await fetchStudentQuizDetails(quizId);
      setQuiz(meta.quiz);

      // Check if user has already used all attempts and has no in-progress attempt
      if (!meta.inProgressAttempt && meta.quiz.maxAttempts > 0 && meta.attemptsUsed >= meta.quiz.maxAttempts) {
        // Fetch attempt history to show result immediately
        const history = await fetchQuizAttempts(quizId);
        setPreviousAttempts(history.attempts || []);
        if (history.attempts?.length > 0) {
          const latestRes = await fetchAttemptResult(history.attempts[0]._id);
          setCompletedAttempt(latestRes.attempt);
        }
        setLoading(false);
        return;
      }

      // 2. Start or resume attempt
      const attemptData = await startQuizAttempt(quizId);
      setAttemptId(attemptData.attemptId);
      setAttemptNumber(attemptData.attemptNumber || 1);

      // Initialize answers if resumed
      if (attemptData.answers && attemptData.answers.length > 0) {
        const initialAnswers = {};
        attemptData.answers.forEach((ans) => {
          initialAnswers[ans.question] = {
            selectedOptionIndex: ans.selectedOptions?.[0] ?? null,
            selectedOptions: ans.selectedOptions || [],
            textAnswer: ans.textAnswer || '',
          };
        });
        setAnswers(initialAnswers);
      }

      // 3. Initialize countdown timer if quiz has time limit
      if (meta.quiz.timeLimit && meta.quiz.timeLimit > 0) {
        const startedTime = new Date(attemptData.startedAt).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startedTime) / 1000);
        const totalAllowedSeconds = meta.quiz.timeLimit * 60;
        const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);
        setTimeRemaining(remaining);
      }

      // Load previous attempts history
      const history = await fetchQuizAttempts(quizId);
      setPreviousAttempts(history.attempts || []);
    } catch (err) {
      console.error('Initialize quiz error:', err);
      setError(err.response?.data?.message || 'Failed to initialize quiz.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  // Submit Attempt Handler (Idempotent)
  const handleSubmit = useCallback(async (forcedByTimer = false) => {
    if (submittedRef.current || isSubmitting) return; // Prevent duplicate clicks
    submittedRef.current = true;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Format answers payload
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        selectedOptionIndex: val.selectedOptionIndex,
        selectedOptions: val.selectedOptions,
        textAnswer: val.textAnswer,
      }));

      const res = await submitQuizAttempt(attemptId, formattedAnswers);
      setCompletedAttempt(res.attempt);
      if (forcedByTimer) {
        setIsTimeExpired(true);
      }

      // Refresh history
      const history = await fetchQuizAttempts(quizId);
      setPreviousAttempts(history.attempts || []);
    } catch (err) {
      console.error('Submit quiz attempt error:', err);
      setError(err.response?.data?.message || 'Error submitting quiz attempt.');
      submittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, attemptId, isSubmitting, quizId]);

  // Countdown timer effect
  useEffect(() => {
    if (completedAttempt || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, completedAttempt, handleSubmit]);

  // Format timer MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer modification helpers
  const handleSingleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionIndex: optionIndex,
        selectedOptions: [optionIndex],
      },
    }));
  };

  const handleMultipleToggle = (questionId, optionIndex) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectedOptions || [];
      const updated = current.includes(optionIndex)
        ? current.filter((i) => i !== optionIndex)
        : [...current, optionIndex].sort((a, b) => a - b);

      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selectedOptions: updated,
          selectedOptionIndex: updated[0] ?? null,
        },
      };
    });
  };

  const handleTrueFalseSelect = (questionId, isTrue) => {
    const optionIndex = isTrue ? 0 : 1;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionIndex: optionIndex,
        selectedOptions: [optionIndex],
      },
    }));
  };

  const handleTextAnswerChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textAnswer: text,
      },
    }));
  };

  // Questions and progress metrics
  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  // Loading View
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Preparing your assessment session...</p>
      </div>
    );
  }

  // Error View
  if (error && !quiz) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Quiz Unavailable</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          to="/student/quizzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RESULTS & OUTCOMES REVIEW VIEW (SCRUM-49 Acceptance)
  // ══════════════════════════════════════════════════════════
  if (completedAttempt) {
    const isPass = completedAttempt.passed;
    const scorePct = completedAttempt.percentage || 0;
    const duration = completedAttempt.durationSeconds || 0;
    const minutesTaken = Math.floor(duration / 60);
    const secondsTaken = duration % 60;

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans animate-fade-in">
        {/* Outcome Header Banner */}
        <div
          className={`relative rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-xl ${
            isPass
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-600/15'
              : 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 shadow-slate-900/20'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
                {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{isPass ? 'Assessment Passed' : 'Assessment Completed'}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {quiz?.title || 'Quiz Assessment'}
              </h1>
              <p className="text-slate-100 text-sm leading-relaxed">
                {isPass
                  ? `Outstanding! You achieved ${scorePct}% and surpassed the ${quiz?.passingScore || 50}% pass requirement.`
                  : `You achieved ${scorePct}%. A score of ${quiz?.passingScore || 50}% is required to pass. Review your questions below to sharpen your understanding.`}
              </p>
            </div>

            {/* Score Ring Display */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[160px]">
              <div className="text-4xl md:text-5xl font-black">{scorePct}%</div>
              <div className="text-xs uppercase tracking-wider font-bold opacity-80 mt-1">
                {completedAttempt.score} / {completedAttempt.maxScore} Points
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{isPass ? 'PASSED' : 'NOT PASSED'}</div>
              <div className="text-xs text-slate-500">Threshold: {quiz?.passingScore || 50}%</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">
                {minutesTaken}m {secondsTaken}s
              </div>
              <div className="text-xs text-slate-500">Duration Taken</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">
                Attempt #{completedAttempt.attemptNumber || 1}
              </div>
              <div className="text-xs text-slate-500">
                {quiz?.maxAttempts > 0 ? `${quiz.maxAttempts} Allowed` : 'Unlimited Attempts'}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Per-Question Review (SCRUM-49 Acceptance) ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-blue-600" />
              Per-Question Performance Review
            </h2>
            <span className="text-xs text-slate-500">
              {completedAttempt.answers?.filter((a) => a.isCorrect).length} of {completedAttempt.answers?.length} correct
            </span>
          </div>

          <div className="space-y-4">
            {(completedAttempt.answers || []).map((ans, idx) => {
              const isCorrect = ans.isCorrect;
              const qType = ans.type || 'single_choice';

              return (
                <div
                  key={ans.question || idx}
                  className={`bg-white rounded-2xl p-6 border transition-all ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center ${
                        isCorrect ? 'bg-emerald-600' : 'bg-rose-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Question {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isCorrect ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Correct (+{ans.pointsAwarded || 1} pts)
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" /> Incorrect (0 / {ans.maxPoints || 1} pts)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-base font-bold text-slate-900 mt-3">
                    {ans.questionText}
                  </h3>

                  {/* MCQ Options Display */}
                  {(qType === 'single_choice' || qType === 'multiple_choice' || qType === 'true_false') && (
                    <div className="mt-4 space-y-2">
                      {(ans.options || []).map((opt, optIdx) => {
                        const isUserChoice = (ans.selectedOptions || []).includes(optIdx);
                        const isAnswerKey = (ans.correctAnswers || []).includes(optIdx);

                        let optStyle = 'border-slate-200 bg-white text-slate-700';
                        if (isUserChoice && isAnswerKey) {
                          optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/20';
                        } else if (isUserChoice && !isAnswerKey) {
                          optStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-2 ring-rose-500/20';
                        } else if (!isUserChoice && isAnswerKey) {
                          optStyle = 'border-emerald-400 bg-emerald-50/50 text-emerald-800 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-sm ${optStyle}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full border border-current text-[11px] font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </span>

                            <div className="flex items-center gap-2 text-xs">
                              {isUserChoice && (
                                <span className="font-bold opacity-80">(Your Selection)</span>
                              )}
                              {isAnswerKey && (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Display */}
                  {qType === 'short_answer' && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Your Submitted Answer: </span>
                        <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {ans.textAnswer || '(Unanswered)'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Accepted Answers: </span>
                        <span className="font-semibold text-emerald-800">
                          {(ans.correctAnswers || []).join(' or ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation Note */}
                  {ans.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Explanation: </span>
                        <span>{ans.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt History List */}
        {previousAttempts.length > 1 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              Previous Attempt History
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {previousAttempts.map((att) => (
                <div key={att._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">
                      Attempt #{att.attemptNumber || 1}
                    </span>
                    <span className="text-slate-400">
                      {new Date(att.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">
                      {att.score} / {att.maxScore} pts ({att.percentage}%)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {att.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link
            to="/student/quizzes"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Quizzes
          </Link>

          {/* Retake button if attempts remaining */}
          {(quiz?.maxAttempts === 0 || previousAttempts.length < quiz?.maxAttempts) && (
            <button
              onClick={() => {
                setCompletedAttempt(null);
                initializeQuiz();
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ACTIVE QUIZ TAKING VIEW
  // ══════════════════════════════════════════════════════════
  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">No Questions in this Quiz</h2>
        <Link to="/student/quizzes" className="text-blue-600 font-bold text-xs">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const qType = currentQuestion.type || 'single_choice';
  const qId = currentQuestion._id;
  const currentAnswer = answers[qId] || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 font-sans">
      {/* ─── Top Header Bar: Title & Countdown Timer ─── */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            {quiz.course?.title || 'Course Quiz'}
          </span>
          <h1 className="text-lg md:text-xl font-black text-slate-900 truncate">
            {quiz.title}
          </h1>
        </div>

        {/* Countdown Timer (Auto-submits on expiry) */}
        {timeRemaining !== null && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shrink-0 shadow-xs ${
              timeRemaining < 60
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* ─── Progress Indicator with aria attributes ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-blue-600 font-semibold">
            {answeredCount} of {questions.length} Answered
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"
        >
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Question Card ─── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
            {qType === 'single_choice' && 'Single Choice (Select 1)'}
            {qType === 'multiple_choice' && 'Multiple Choice (Select all that apply)'}
            {qType === 'true_false' && 'True / False'}
            {qType === 'short_answer' && 'Short Answer'}
          </span>

          <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* ─── Options Renderers ─── */}
        {/* TYPE 1: Single Choice (Radio) */}
        {qType === 'single_choice' && (
          <div className="space-y-3 pt-2">
            {(currentQuestion.options || []).map((option, optIdx) => {
              const isSelected = currentAnswer.selectedOptionIndex === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSingleSelect(qId, optIdx)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 2: Multiple Choice (Checkbox) */}
        {qType === 'multiple_choice' && (
          <div className="space-y-3 pt-2">
            {(currentQuestion.options || []).map((option, optIdx) => {
              const isSelected = (currentAnswer.selectedOptions || []).includes(optIdx);

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleMultipleToggle(qId, optIdx)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 3: True / False */}
        {qType === 'true_false' && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleTrueFalseSelect(qId, true)}
              className={`py-4 px-6 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                currentAnswer.selectedOptionIndex === 0
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Check className="w-5 h-5 text-emerald-600" />
              <span>True</span>
            </button>

            <button
              type="button"
              onClick={() => handleTrueFalseSelect(qId, false)}
              className={`py-4 px-6 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                currentAnswer.selectedOptionIndex === 1
                  ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <X className="w-5 h-5 text-rose-600" />
              <span>False</span>
            </button>
          </div>
        )}

        {/* TYPE 4: Short Answer (Input) */}
        {qType === 'short_answer' && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-600">
              Type your answer below:
            </label>
            <input
              type="text"
              value={currentAnswer.textAnswer || ''}
              onChange={(e) => handleTextAnswerChange(qId, e.target.value)}
              placeholder="Enter exact keyword or phrase..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <p className="text-[11px] text-slate-400">
              Graded automatically. Answers are case-insensitive.
            </p>
          </div>
        )}
      </div>

      {/* ─── Navigation Controls: Prev, Next, Submit ─── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-3">
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Submit Quiz
            </button>
          )}
        </div>
      </div>

      {/* ─── Submit Confirmation Dialog (Requirement) ─── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Submit Quiz Attempt?</h3>
              <p className="text-xs text-slate-500">
                You have answered{' '}
                <span className="font-bold text-slate-800">{answeredCount} of {questions.length}</span> questions.
                Once submitted, your responses will be evaluated and recorded immediately.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Review Answers
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;
