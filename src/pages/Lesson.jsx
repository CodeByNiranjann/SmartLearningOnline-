import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchLessonDetails, fetchLessonResources, completeLesson, fetchCourseProgress } from '../services/api';
import ResourceCard from '../components/ResourceCard';
import { CheckCircle, ArrowLeft, ArrowRight, BookOpen, Layers, Sparkles, AlertCircle } from 'lucide-react';

const Lesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lessonData, setLessonData] = useState(null);
  const [resources, setResources] = useState([]);
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

        const [details, resList, progressData] = await Promise.all([
          fetchLessonDetails(lessonId),
          fetchLessonResources(lessonId),
          fetchCourseProgress(courseId),
        ]);

        setLessonData(details);
        setResources(resList);

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
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Loading lesson workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !lessonData?.lesson) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Lesson Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'The requested lesson is unavailable.'}</p>
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Path
        </Link>
      </div>
    );
  }

  const { lesson, prevLessonId, nextLessonId, totalCourseLessons, currentLessonIndex } = lessonData;

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning Path
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          Lesson {currentLessonIndex} of {totalCourseLessons}
        </span>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-sm animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {nextLessonId && (
            <Link
              to={`/learning/${courseId}/${nextLessonId}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="space-y-2 border-b border-slate-800 pb-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Lesson {currentLessonIndex}
                </span>
                {isCompleted && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-slate-400 text-sm leading-relaxed">{lesson.description}</p>
              )}
            </div>

            {/* Formatted Text Content */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm md:text-base leading-relaxed space-y-4">
              {lesson.content.split('\n\n').map((paragraph, idx) => (
                <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 whitespace-pre-wrap font-mono text-xs md:text-sm text-slate-300">
                  {paragraph}
                </div>
              ))}
            </div>

            {/* Action Buttons Bar */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleMarkComplete}
                disabled={completing || isCompleted}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                  isCompleted
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 cursor-pointer'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Complete'}</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {prevLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${prevLessonId}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl bg-slate-900/50 text-slate-600 text-xs font-semibold cursor-not-allowed border border-slate-800">
                    Previous
                  </span>
                )}

                {nextLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${nextLessonId}`}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/courses/${courseId}`}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Learning Resources
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                {resources.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Curated documentation, videos, PDFs, and repository links for this lesson.
            </p>

            {resources.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-800/40 rounded-xl border border-slate-800">
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
