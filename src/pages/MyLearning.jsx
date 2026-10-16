import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentProgress } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { GraduationCap, Play, Compass, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

const MyLearning = () => {
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All'); // All | InProgress | Completed

  useEffect(() => {
    const loadMyLearning = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchStudentProgress();
        if (data && data.progressList) {
          setProgressList(data.progressList);
        }
      } catch (err) {
        console.error('Error loading my learning:', err);
        setError('Could not load your courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMyLearning();
  }, []);

  const filteredList = progressList.filter((item) => {
    // Skip items where courseId is null/unpopulated (e.g. deleted course)
    if (!item?.courseId || typeof item.courseId !== 'object') return false;
    if (filter === 'InProgress') return (item.progressPercentage ?? 0) < 100;
    if (filter === 'Completed') return (item.progressPercentage ?? 0) === 100;
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>My Learning Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Enrolled Courses</h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Keep track of your active learning progress, resume remaining modules, and achieve course completion certificates.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
          <button
            onClick={() => setError('')}
            className="ml-auto text-rose-500 hover:text-rose-700 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] inline-flex items-center gap-2">
        {['All', 'InProgress', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab === 'All' ? 'All Courses' : tab === 'InProgress' ? 'In Progress' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-52 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-slate-200/80 p-12 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No enrolled courses found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {filter === 'All'
                ? 'You have not enrolled in any courses yet. Explore available courses to begin learning.'
                : `No courses in the "${filter === 'InProgress' ? 'In Progress' : 'Completed'}" filter. Try switching to "All Courses".`}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors"
          >
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((item) => {
            const course = item.courseId;
            // Safety: skip if course object is not properly populated
            if (!course || typeof course !== 'object') return null;

            const nextLessonId = item.lastAccessedLesson?._id || item.currentLesson?._id;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-blue-300 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {course.category || 'Course'}
                    </span>
                    {(item.progressPercentage ?? 0) === 100 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                    {course.title || 'Untitled Course'}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description || ''}
                  </p>

                  <div className="pt-1">
                    <ProgressBar percentage={item.progressPercentage || 0} size="md" />
                  </div>

                  {item.currentLesson && (
                    <p className="text-xs text-slate-600 truncate bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                      <span className="font-semibold text-slate-800">Current Lesson:</span>{' '}
                      {item.currentLesson.title}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/courses/${course._id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    View Learning Path
                  </Link>

                  <Link
                    to={
                      nextLessonId
                        ? `/learning/${course._id}/${nextLessonId}`
                        : `/courses/${course._id}`
                    }
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {(item.progressPercentage ?? 0) === 100 ? 'Review Course' : 'Continue Learning'}
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyLearning;
