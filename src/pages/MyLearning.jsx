import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentProgress, fetchMyProjects } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import {
  GraduationCap,
  Play,
  Compass,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  FolderGit2,
  Clock,
  Layers,
  Code2,
} from 'lucide-react';

const STATUS_BADGES = {
  not_started: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  in_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_revision: 'bg-rose-50 text-rose-700 border-rose-200',
};

const MyLearning = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'projects'
  const [progressList, setProgressList] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All'); // All | InProgress | Completed

  useEffect(() => {
    const loadMyLearning = async () => {
      try {
        setLoading(true);
        setError('');
        const [courseData, projData] = await Promise.all([
          fetchStudentProgress().catch(() => ({ progressList: [] })),
          fetchMyProjects().catch(() => ({ projects: [] })),
        ]);

        if (courseData && courseData.progressList) {
          setProgressList(courseData.progressList);
        }
        if (projData && projData.projects) {
          setMyProjects(projData.projects);
        }
      } catch (err) {
        console.error('Error loading my learning:', err);
        setError('Could not load your courses or projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMyLearning();
  }, []);

  const filteredCourses = progressList.filter((item) => {
    if (!item?.courseId || typeof item.courseId !== 'object') return false;
    if (filter === 'InProgress') return (item.progressPercentage ?? 0) < 100;
    if (filter === 'Completed') return (item.progressPercentage ?? 0) === 100;
    return true;
  });

  const filteredProjects = myProjects.filter((p) => {
    const status = p.myEnrollment?.status;
    if (filter === 'InProgress') return status === 'in_progress' || status === 'not_started';
    if (filter === 'Completed') return status === 'completed';
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Enrolled Courses & Projects</h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Keep track of your active course modules and practical capstone milestones to achieve certificates and build job-ready portfolios.
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

      {/* Portal Tabs: Enrolled Courses vs My Projects */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex items-center gap-1.5 self-start">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enrolled Courses ({progressList.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            My Real-World Projects ({myProjects.length})
          </button>
        </div>

        {/* Filter Pills */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm inline-flex items-center gap-1.5">
          {['All', 'InProgress', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? 'All' : tab === 'InProgress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SECTION 1: ENROLLED COURSES ─── */}
      {activeTab === 'courses' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-52 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white border border-slate-200/80 p-12 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No enrolled courses found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {filter === 'All'
                    ? 'You have not enrolled in any courses yet. Explore available courses to begin learning.'
                    : `No courses in the "${filter === 'InProgress' ? 'In Progress' : 'Completed'}" filter.`}
                </p>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((item) => {
                const course = item.courseId;
                if (!course || typeof course !== 'object') return null;
                const nextLessonId = item.lastAccessedLesson?._id || item.currentLesson?._id;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {course.category || 'Course'}
                        </span>
                        {(item.progressPercentage ?? 0) === 100 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (item.progressPercentage ?? 0) > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            In Progress ({item.progressPercentage}%)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Not Started
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
                        View Curriculum
                      </Link>

                      <Link
                        to={
                          nextLessonId
                            ? `/learning/${course._id}/${nextLessonId}`
                            : `/courses/${course._id}`
                        }
                        className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
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
        </>
      )}

      {/* ─── SECTION 2: MY REAL-WORLD PROJECTS ─── */}
      {activeTab === 'projects' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-52 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-slate-200/80 p-12 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FolderGit2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No Joined Projects Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {filter === 'All'
                    ? 'Explore real-world capstone projects and join one to start working on ordered milestones.'
                    : `No projects in the "${filter === 'InProgress' ? 'In Progress' : 'Completed'}" filter.`}
                </p>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Explore Projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((proj) => {
                const enrollment = proj.myEnrollment;
                const status = enrollment?.status || 'not_started';

                return (
                  <div
                    key={proj._id}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-40 overflow-hidden bg-slate-100">
                        <img
                          src={proj.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              STATUS_BADGES[status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/70 text-slate-200 backdrop-blur-sm">
                            {proj.difficulty}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>

                        {/* Milestone Progress Bar */}
                        {enrollment && enrollment.totalMilestones > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>Milestone Progress</span>
                              <span className="text-blue-600">
                                {enrollment.completedMilestones} / {enrollment.totalMilestones} ({enrollment.progressPercentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link
                        to={`/projects/${proj._id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Continue Capstone</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyLearning;
