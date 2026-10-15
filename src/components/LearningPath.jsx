import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, PlayCircle, Lock, BookOpen, ArrowRight } from 'lucide-react';

const LearningPath = ({ modules = [], courseId, completedLessons = [], currentLessonId }) => {
  let isPreviousLessonCompleted = true; // First lesson is always unlocked

  // Normalize completedLessons to a set of string IDs
  const completedSet = new Set(
    (completedLessons || []).map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : id?.toString()))
  );
  const currentIdStr = typeof currentLessonId === 'object' && currentLessonId?._id
    ? currentLessonId._id.toString()
    : currentLessonId?.toString();

  return (
    <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
      {modules.map((module, modIndex) => {
        const modLessons = module.lessons || [];
        const modCompletedCount = modLessons.filter((l) => completedSet.has(l._id?.toString())).length;
        const isModuleCompleted = modLessons.length > 0 && modCompletedCount === modLessons.length;

        return (
          <div key={module._id} className="relative pl-12 space-y-4">
            {/* Module Node Indicator */}
            <div
              className={`absolute left-3.5 top-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all ${isModuleCompleted
                  ? 'bg-emerald-600 border-2 border-emerald-600 text-white'
                  : 'bg-white border-2 border-blue-600 text-blue-600'
                }`}
            >
              {isModuleCompleted ? (
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              ) : (
                <span className="text-[10px] font-bold">{modIndex + 1}</span>
              )}
            </div>

            {/* Module Header Card */}
            <div
              className={`rounded-2xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-colors ${isModuleCompleted
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-white border-slate-200/80'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Module {modIndex + 1}
                    </span>
                    {isModuleCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Module Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{module.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                    {modLessons.length} Lessons
                  </span>
                  {modLessons.length > 0 && (
                    <span className="text-[11px] font-medium text-slate-500">
                      {modCompletedCount}/{modLessons.length} Completed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lessons List under Module */}
            <div className="space-y-3 pl-2">
              {modLessons.map((lesson, lessonIndex) => {
                const lessonIdStr = lesson._id?.toString();
                const isCompleted = completedSet.has(lessonIdStr);
                const isCurrent = currentIdStr && currentIdStr === lessonIdStr;
                const isUnlocked = isPreviousLessonCompleted || isCompleted || isCurrent;

                // Update isPreviousLessonCompleted for the next lesson iteration
                isPreviousLessonCompleted = isCompleted;

                return (
                  <div
                    key={lesson._id}
                    className={`group rounded-xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 ${isCurrent
                        ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                        : isCompleted
                          ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                          : isUnlocked
                            ? 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-sm'
                            : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Lesson Icon */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : isCurrent ? (
                          <PlayCircle className="w-5 h-5 text-blue-600 animate-pulse" />
                        ) : isUnlocked ? (
                          <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">
                            {modIndex + 1}.{lessonIndex + 1}
                          </span>
                          <h4
                            className={`text-sm font-semibold truncate ${isCurrent
                                ? 'text-blue-700 font-bold'
                                : isCompleted
                                  ? 'text-slate-800'
                                  : isUnlocked
                                    ? 'text-slate-700 group-hover:text-slate-900'
                                    : 'text-slate-400'
                              }`}
                          >
                            {lesson.title}
                          </h4>
                        </div>
                        {lesson.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{lesson.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Lesson Action Button */}
                    <div className="flex-shrink-0">
                      {isUnlocked ? (
                        <Link
                          to={`/learning/${courseId}/${lesson._id}`}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${isCurrent
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                              : isCompleted
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                            }`}
                        >
                          <span>{isCurrent ? 'Continue' : isCompleted ? 'Review' : 'Start'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LearningPath;
