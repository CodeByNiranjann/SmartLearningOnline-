import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentProgress } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { GraduationCap, Play, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

const MyLearning = () => {
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All | InProgress | Completed

  useEffect(() => {
    const loadMyLearning = async () => {
      try {
        setLoading(true);
        const data = await fetchStudentProgress();
        if (data && data.progressList) {
          setProgressList(data.progressList);
        }
      } catch (err) {
        console.error('Error loading my learning:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMyLearning();
  }, []);

  const filteredList = progressList.filter((item) => {
    if (filter === 'InProgress') return item.progressPercentage < 100;
    if (filter === 'Completed') return item.progressPercentage === 100;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>My Learning Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Enrolled Courses</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Keep track of your active learning progress, resume remaining modules, and achieve course completion certificates.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['All', 'InProgress', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
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
            <div key={n} className="h-52 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 p-12 rounded-2xl text-center space-y-3">
          <Compass className="w-12 h-12 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No enrolled courses found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You have not started any courses in this filter view. Explore available courses to begin learning.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
          >
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((item) => {
            const course = item.courseId;
            if (!course) return null;
            const nextLessonId = item.currentLesson?._id;

            return (
              <div
                key={item._id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {course.category}
                    </span>
                    {item.progressPercentage === 100 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>

                  <ProgressBar percentage={item.progressPercentage} size="md" />

                  {item.currentLesson && (
                    <p className="text-xs text-slate-400 truncate">
                      <span className="font-semibold text-slate-300">Current Lesson:</span> {item.currentLesson.title}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <Link
                    to={`/courses/${course._id}`}
                    className="text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    View Modules
                  </Link>

                  <Link
                    to={nextLessonId ? `/learning/${course._id}/${nextLessonId}` : `/courses/${course._id}`}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{item.progressPercentage === 100 ? 'Review Course' : 'Continue Learning'}</span>
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
