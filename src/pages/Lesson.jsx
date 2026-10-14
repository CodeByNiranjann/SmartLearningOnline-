import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchLessonDetails, fetchLessonResources, completeLesson, fetchCourseProgress, fetchLessonQuiz, submitQuiz } from '../services/api';
import ResourceCard from '../components/ResourceCard';
import { CheckCircle, ArrowLeft, ArrowRight, BookOpen, Layers, Sparkles, AlertCircle, HelpCircle, Check, X, Award, RotateCcw } from 'lucide-react';

const Lesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lessonData, setLessonData] = useState(null);
  const [resources, setResources] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccessMsg('');
        setQuizResult(null);
        setQuizAnswers({});

        const [details, resList, progressData, quizData] = await Promise.all([
          fetchLessonDetails(lessonId),
          fetchLessonResources(lessonId),
          fetchCourseProgress(courseId),
          fetchLessonQuiz(lessonId).catch(() => null),
        ]);

        setLessonData(details);
        setResources(resList);
        setQuiz(quizData);

        if (progressData && progressData.completedLessons) {
          setIsCompleted(progressData.completedLessons.includes(lessonId));
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Failed to load lesson content. Please check server connection.');
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();
  }, [courseId, lessonId]);

  const handleQuizAnswerSelect = (questionId, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz) return;

    const formattedAnswers = Object.entries(quizAnswers).map(([qId, optIdx]) => ({
      questionId: qId,
      selectedOptionIndex: optIdx,
    }));

    if (formattedAnswers.length < quiz.questions.length) {
      setQuizError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmittingQuiz(true);
      setQuizError('');
      const result = await submitQuiz(quiz._id, formattedAnswers);
      setQuizResult(result);
      if (result.passed && !isCompleted) {
        // Auto-mark lesson complete on passing quiz
        handleMarkComplete();
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      setQuizError(err.response?.data?.message || 'Error grading quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
  };

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      setError('');
      const res = await completeLesson(courseId, lessonId);
      setIsCompleted(true);
      setSuccessMsg('Lesson completed successfully! Progress saved.');

      // Auto clear success message after 4s
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      setError('Could not update lesson progress. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading lesson workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !lessonData?.lesson) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Lesson Not Found</h3>
        <p className="text-sm text-slate-600">{error || 'The requested lesson is unavailable.'}</p>
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Path
        </Link>
      </div>
    );
  }

  const { lesson, prevLessonId, nextLessonId, totalCourseLessons, currentLessonIndex } = lessonData;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning Path
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          Lesson {currentLessonIndex} of {totalCourseLessons}
        </span>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {nextLessonId && (
            <Link
              to={`/learning/${courseId}/${nextLessonId}`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              Next Lesson <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Main Grid: Content & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Lesson Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            {/* Header */}
            <div className="space-y-2 border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Lesson {currentLessonIndex}
                </span>
                {isCompleted && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-slate-500 text-sm leading-relaxed">{lesson.description}</p>
              )}
            </div>

            {/* Formatted Text Content */}
            <div className="max-w-none text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
              {lesson.content.split('\n\n').map((paragraph, idx) => (
                <div key={idx} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 whitespace-pre-wrap font-mono text-xs md:text-sm text-slate-800">
                  {paragraph}
                </div>
              ))}
            </div>

            {/* ─── Knowledge Check Assessment (SLP-17 & SLP-18) ─── */}
            {quiz && (
              <div className="mt-8 pt-8 border-t border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                        {quiz.title || 'Lesson Assessment'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Test your understanding to reinforce core concepts. Passing score: {quiz.passingScore}%
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {quiz.questions?.length || 0} Questions
                  </span>
                </div>

                {quizError && (
                  <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{quizError}</span>
                  </div>
                )}

                {!quizResult ? (
                  /* Quiz Taking Form */
                  <form onSubmit={handleSubmitQuiz} className="space-y-6">
                    {quiz.questions.map((q, qIdx) => (
                      <fieldset key={q._id || qIdx} className="p-4 md:p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                        <legend className="text-xs md:text-sm font-bold text-slate-800 px-1">
                          Question {qIdx + 1}: {q.questionText}
                        </legend>
                        <div role="radiogroup" aria-label={`Question ${qIdx + 1}`} className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[q._id] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs md:text-sm cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/60'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q._id}`}
                                  value={optIdx}
                                  checked={isSelected}
                                  onChange={() => handleQuizAnswerSelect(q._id, optIdx)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <span className="flex-1">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}

                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      <span className="text-xs text-slate-500">
                        {Object.keys(quizAnswers).length} of {quiz.questions.length} answered
                      </span>
                      <button
                        type="submit"
                        disabled={submittingQuiz}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                      >
                        {submittingQuiz ? 'Grading...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Quiz Result View */
                  <div className="space-y-6">
                    <div
                      className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        quizResult.passed
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50/80 border-amber-300 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                            quizResult.passed ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg">
                              Score: {quizResult.score}%
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                quizResult.passed
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {quizResult.passed ? 'Passed' : 'Needs Review'}
                            </span>
                          </div>
                          <p className="text-xs opacity-90 mt-0.5">
                            {quizResult.correctCount} of {quizResult.totalQuestions} questions correct (Passing: {quizResult.passingScore}%)
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleRetakeQuiz}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
                      </button>
                    </div>

                    {/* Detailed Feedback Breakdown */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assessment Feedback & Explanations
                      </h3>
                      {quizResult.feedback?.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-xs space-y-2 ${
                            item.isCorrect
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800">
                              Q{idx + 1}: {item.questionText}
                            </p>
                            <span
                              className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                item.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {item.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            <strong>Your Answer:</strong>{' '}
                            {item.selectedOptionIndex !== null ? item.options[item.selectedOptionIndex] : 'Not answered'}
                          </p>
                          {!item.isCorrect && (
                            <p className="text-emerald-700 font-medium">
                              <strong>Correct Answer:</strong> {item.options[item.correctOptionIndex]}
                            </p>
                          )}
                          {item.explanation && (
                            <p className="text-slate-500 italic bg-white/60 p-2 rounded-lg border border-slate-200/50">
                              💡 {item.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Bar */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleMarkComplete}
                disabled={completing || isCompleted}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Complete'}</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {prevLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${prevLessonId}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200/60"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200/60">
                    Previous
                  </span>
                )}

                {nextLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${nextLessonId}`}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/courses/${courseId}`}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-500/20"
                  >
                    Finish Course <Sparkles className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Learning Resources */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Learning Resources
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {resources.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Curated documentation, videos, PDFs, and repository links for this lesson.
            </p>

            {resources.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/80">
                No external resources attached to this lesson.
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <ResourceCard key={resource._id} resource={resource} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson;
