import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  PlayCircle,
  Lock,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Layers,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

/**
 * Pure helper function to compute module completion and sequential lesson unlocking
 * without mutating variables within React component render or closure scopes.
 */
function buildComputedModules(modules, completedSet, currentIdStr) {
  let prevLessonCompleted = true; // First lesson is always unlocked
  const result = [];

  for (const module of modules || []) {
    const modLessons = module.lessons || [];
    const modCompletedCount = modLessons.filter((l) =>
      completedSet.has(l._id?.toString())
    ).length;
    const isModuleCompleted =
      modLessons.length > 0 && modCompletedCount === modLessons.length;

    const lessonsWithStatus = [];
    for (const lesson of modLessons) {
      const lessonIdStr = lesson._id?.toString();
      const isCompleted = completedSet.has(lessonIdStr);
      const isCurrent = !isCompleted && Boolean(currentIdStr && currentIdStr === lessonIdStr);
      const isUnlocked = prevLessonCompleted || isCompleted || isCurrent;

      // Update sequential completion status for the next lesson
      prevLessonCompleted = isCompleted;

      lessonsWithStatus.push({
        ...lesson,
        isCompleted,
        isCurrent,
        isUnlocked,
      });
    }

    result.push({
      ...module,
      lessonsWithStatus,
      completedCount: modCompletedCount,
      totalCount: modLessons.length,
      isCompleted: isModuleCompleted,
      progressPercent:
        modLessons.length > 0
          ? Math.round((modCompletedCount / modLessons.length) * 100)
          : 0,
    });
  }

  return result;
}

const LearningPath = ({
  modules = [],
  courseId,
  completedLessons = [],
  currentLessonId,
  isEnrolled = false,
  onEnroll,
}) => {
  // Normalize completedLessons to a set of string IDs
  const completedSet = useMemo(() => {
    return new Set(
      (completedLessons || []).map((id) =>
        typeof id === 'object' && id?._id ? id._id.toString() : id?.toString()
      )
    );
  }, [completedLessons]);

  const currentIdStr = useMemo(() => {
    return typeof currentLessonId === 'object' && currentLessonId?._id
      ? currentLessonId._id.toString()
      : currentLessonId?.toString();
  }, [currentLessonId]);

  // Compute status for all modules and lessons
  const computedModules = useMemo(() => {
    return buildComputedModules(modules, completedSet, currentIdStr);
  }, [modules, completedSet, currentIdStr]);

  // Identify "What to Learn Next"
  const nextLessonInfo = useMemo(() => {
    for (let mIdx = 0; mIdx < computedModules.length; mIdx++) {
      const mod = computedModules[mIdx];
      for (let lIdx = 0; lIdx < mod.lessonsWithStatus.length; lIdx++) {
        const les = mod.lessonsWithStatus[lIdx];
        if (!les.isCompleted) {
          return {
            lesson: les,
            module: mod,
            moduleIndex: mIdx + 1,
            lessonIndex: lIdx + 1,
            isAllCompleted: false,
          };
        }
      }
    }
    const hasLessons = computedModules.some((m) => m.lessonsWithStatus.length > 0);
    return {
      lesson: null,
      module: null,
      moduleIndex: 0,
      lessonIndex: 0,
      isAllCompleted: hasLessons && computedModules.length > 0,
    };
  }, [computedModules]);

  // Overall path metrics
  const pathMetrics = useMemo(() => {
    const totalModules = computedModules.length;
    const completedModules = computedModules.filter((m) => m.isCompleted).length;
    let totalLessons = 0;
    let completedLessonsCount = 0;

    for (const mod of computedModules) {
      totalLessons += mod.totalCount;
      completedLessonsCount += mod.completedCount;
    }

    const overallPercent =
      totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    const remainingLessons = Math.max(0, totalLessons - completedLessonsCount);
    // Average 15 mins per remaining lesson
    const estimatedHoursRemaining = (remainingLessons * 15) / 60;
    const formattedTime =
      estimatedHoursRemaining >= 1
        ? `${estimatedHoursRemaining.toFixed(1)} hrs`
        : `${remainingLessons * 15} mins`;

    return {
      totalModules,
      completedModules,
      totalLessons,
      completedLessonsCount,
      overallPercent,
      remainingLessons,
      formattedTime,
    };
  }, [computedModules]);

  // Accordion state per module
  const [expandedModules, setExpandedModules] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'in_progress' | 'completed'

  // Initialize all modules as expanded by default so learners have full visibility
  useEffect(() => {
    if (computedModules.length > 0) {
      const initial = {};
      computedModules.forEach((m, idx) => {
        initial[m._id || idx] = true;
      });
      setExpandedModules(initial);
    }
  }, [computedModules.length]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = (expand) => {
    const nextState = {};
    computedModules.forEach((m, idx) => {
      nextState[m._id || idx] = expand;
    });
    setExpandedModules(nextState);
  };

  const scrollToLesson = (lessonId) => {
    const elem = document.getElementById(`lesson-node-${lessonId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold text-slate-800">No Learning Path Published Yet</h3>
          <p className="text-sm text-slate-500">
            The instructor is finalizing the syllabus modules. Check back shortly to embark on this roadmap.
          </p>
        </div>
      </div>
    );
  }

  // Filter modules for display
  const displayedModules = computedModules.filter((m) => {
    if (filter === 'completed') return m.isCompleted;
    if (filter === 'in_progress') return !m.isCompleted;
    return true;
  });

  const firstLessonId =
    computedModules[0]?.lessonsWithStatus[0]?._id || null;

  return (
    <div className="space-y-6 font-sans">
      {/* ─── SLP-3: WHAT TO LEARN NEXT CALLOUT BANNER ─── */}
      {nextLessonInfo.lesson && (
        <div
          id="learning-path-next-step"
          className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 md:p-8 shadow-xl shadow-blue-600/15 overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-bold uppercase tracking-wider border border-white/20">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>What to Learn Next</span>
                <span className="text-white/40">•</span>
                <span className="text-white">
                  Step {nextLessonInfo.moduleIndex}.{nextLessonInfo.lessonIndex}
                </span>
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                  {nextLessonInfo.lesson.title}
                </h3>
                <p className="text-sm text-blue-100/90 mt-1 leading-relaxed">
                  In <span className="font-semibold text-white">{nextLessonInfo.module.title}</span>
                  {nextLessonInfo.lesson.description && ` — ${nextLessonInfo.lesson.description}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100">
                <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  {nextLessonInfo.lesson.duration || '15 mins'}
                </span>
                <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Core Roadmap Milestone
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <Link
                to={`/learning/${courseId}/${nextLessonInfo.lesson._id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm shadow-lg shadow-black/15 transition-all duration-200 cursor-pointer text-center"
              >
                <span>{pathMetrics.completedLessonsCount > 0 ? 'Resume Next Lesson' : 'Start First Lesson'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => scrollToLesson(nextLessonInfo.lesson._id)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-colors text-center cursor-pointer"
              >
                <span>Locate in Roadmap</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL COMPLETED CELEBRATION BANNER ─── */}
      {nextLessonInfo.isAllCompleted && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 md:p-8 shadow-xl shadow-emerald-600/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Learning Path Complete</span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Outstanding Work! You Mastered Every Lesson 🎉
            </h3>
            <p className="text-sm text-emerald-100 max-w-xl">
              You have completed all {pathMetrics.totalLessons} lessons across {pathMetrics.totalModules} modules in this course. You can revisit and review any lesson whenever needed.
            </p>
          </div>

          {firstLessonId && (
            <Link
              to={`/learning/${courseId}/${firstLessonId}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-md transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Review from Start</span>
            </Link>
          )}
        </div>
      )}

      {/* ─── ROADMAP STATS STRIP ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Modules</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900">{pathMetrics.totalModules}</span>
            <span className="text-xs text-slate-500">
              ({pathMetrics.completedModules} Completed)
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Lessons</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900">{pathMetrics.totalLessons}</span>
            <span className="text-xs text-slate-500">
              ({pathMetrics.completedLessonsCount} Finished)
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Path Completion</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-blue-600">{pathMetrics.overallPercent}%</span>
            <span className="text-xs text-slate-500">Mastery</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Remaining</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900">{pathMetrics.formattedTime}</span>
            <span className="text-xs text-slate-500">Pace</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER TABS & EXPAND/COLLAPSE CONTROLS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Modules ({pathMetrics.totalModules})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({pathMetrics.totalModules - pathMetrics.completedModules})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({pathMetrics.completedModules})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ─── STRUCTURED ROADMAP TIMELINE ─── */}
      <div className="space-y-6 relative before:absolute before:left-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
        {displayedModules.map((module, modIndex) => {
          const lessons = module.lessonsWithStatus || [];
          const isModuleCompleted = module.isCompleted;
          const isExpanded = expandedModules[module._id || modIndex] !== false;
          const containsNextLesson =
            nextLessonInfo.lesson &&
            lessons.some((l) => l._id?.toString() === nextLessonInfo.lesson._id?.toString());

          return (
            <div
              key={module._id || modIndex}
              className={`relative pl-12 space-y-3 transition-all ${
                containsNextLesson ? 'ring-2 ring-blue-500/20 rounded-2xl p-2' : ''
              }`}
            >
              {/* Module Node Indicator on Timeline */}
              <div
                className={`absolute left-6 top-5 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                  isModuleCompleted
                    ? 'bg-emerald-600 border-2 border-white text-white shadow-emerald-500/20'
                    : containsNextLesson
                    ? 'bg-blue-600 border-2 border-white text-white shadow-blue-500/30 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-600'
                }`}
              >
                {isModuleCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-[11px] font-bold">{modIndex + 1}</span>
                )}
              </div>

              {/* Module Header Card with Toggle */}
              <div
                onClick={() => toggleModule(module._id || modIndex)}
                className={`rounded-2xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer transition-all duration-200 select-none ${
                  isModuleCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                    : containsNextLesson
                    ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border-blue-300 hover:border-blue-400'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Module {modIndex + 1}
                      </span>

                      {isModuleCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Completed
                        </span>
                      )}

                      {containsNextLesson && !isModuleCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-600 fill-blue-600" /> Current Milestone
                        </span>
                      )}
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                      {module.title}
                    </h3>

                    {module.description && (
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {module.completedCount}/{lessons.length} Done ({module.progressPercent}%)
                      </span>
                      <div className="text-slate-400 hover:text-slate-700 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Mini progress bar for module */}
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isModuleCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${module.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons List inside Module (Collapsible) */}
              {isExpanded && (
                <div className="space-y-2.5 pl-2 pt-1 transition-all">
                  {lessons.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No lessons published in this module yet.
                    </div>
                  ) : (
                    lessons.map((lesson, lessonIndex) => {
                      const { isCompleted, isCurrent, isUnlocked } = lesson;
                      const isTargetNext =
                        nextLessonInfo.lesson &&
                        nextLessonInfo.lesson._id?.toString() === lesson._id?.toString();

                      return (
                        <div
                          key={lesson._id || lessonIndex}
                          id={`lesson-node-${lesson._id}`}
                          className={`group rounded-xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 ${
                            isTargetNext
                              ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-md'
                              : isCurrent
                              ? 'bg-blue-50/60 border-blue-300 shadow-sm'
                              : isCompleted
                              ? 'bg-white border-emerald-200/90 hover:border-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                              : isUnlocked
                              ? 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                              : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {/* Lesson Status Icon */}
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                                </div>
                              ) : isTargetNext ? (
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 animate-pulse">
                                  <PlayCircle className="w-5 h-5" />
                                </div>
                              ) : isUnlocked ? (
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                  <Lock className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Lesson Title & Details */}
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">
                                  {modIndex + 1}.{lessonIndex + 1}
                                </span>

                                <h4
                                  className={`text-sm truncate ${
                                    isTargetNext
                                      ? 'text-blue-900 font-bold'
                                      : isCompleted
                                      ? 'text-slate-800 font-medium'
                                      : isUnlocked
                                      ? 'text-slate-700 font-medium group-hover:text-slate-900'
                                      : 'text-slate-400 font-medium'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>

                                {isTargetNext && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                                    Up Next
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-1">
                                {lesson.description && (
                                  <p className="text-xs text-slate-500 truncate max-w-md">
                                    {lesson.description}
                                  </p>
                                )}
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration || '15m'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Lesson Action CTA */}
                          <div className="flex-shrink-0">
                            {isUnlocked ? (
                              <Link
                                to={`/learning/${courseId}/${lesson._id}`}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isTargetNext
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25'
                                    : isCompleted
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                                }`}
                              >
                                <span>{isTargetNext ? 'Resume' : isCompleted ? 'Review' : 'Start'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 flex items-center gap-1.5 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Locked</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPath;
