import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, PlayCircle, Lock, BookOpen, ArrowRight } from 'lucide-react';

const LearningPath = ({ modules = [], courseId, completedLessons = [], currentLessonId }) => {
  let isPreviousLessonCompleted = true; // First lesson is always unlocked

  return (
    <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-700/60">
      {modules.map((module, modIndex) => (
        <div key={module._id} className="relative pl-12 space-y-4">
          {/* Module Node Indicator */}
          <div className="absolute left-3.5 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-indigo-400">{modIndex + 1}</span>
          </div>

          {/* Module Header Card */}
          <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Module {modIndex + 1}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{module.title}</h3>
                {module.description && (
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{module.description}</p>
                )}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 whitespace-nowrap">
                {module.lessons ? module.lessons.length : 0} Lessons
              </span>
            </div>
          </div>

          {/* Lessons List under Module */}
          <div className="space-y-3 pl-2">
            {module.lessons &&
              module.lessons.map((lesson, lessonIndex) => {
                const isCompleted = completedLessons.includes(lesson._id);
                const isCurrent = currentLessonId === lesson._id;
                const isUnlocked = isPreviousLessonCompleted || isCompleted || isCurrent;

                // Update isPreviousLessonCompleted for the next lesson iteration
                isPreviousLessonCompleted = isCompleted;

                return (
                  <div
                    key={lesson._id}
                    className={`group rounded-xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : isCompleted
                        ? 'bg-slate-800/60 border-emerald-500/30 hover:border-emerald-500/50'
                        : isUnlocked
                        ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Lesson Icon */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : isCurrent ? (
                          <PlayCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
                        ) : isUnlocked ? (
                          <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-300" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">
                            {modIndex + 1}.{lessonIndex + 1}
                          </span>
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCurrent
                                ? 'text-indigo-300 font-bold'
                                : isCompleted
                                ? 'text-slate-200'
                                : isUnlocked
                                ? 'text-slate-300 group-hover:text-white'
                                : 'text-slate-500'
                            }`}
                          >
                            {lesson.title}
                          </h4>
                        </div>
                        {lesson.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{lesson.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Lesson Action Button */}
                    <div className="flex-shrink-0">
                      {isUnlocked ? (
                        <Link
                          to={`/learning/${courseId}/${lesson._id}`}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                              : isCompleted
                              ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          <span>{isCurrent ? 'Continue' : isCompleted ? 'Review' : 'Start'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LearningPath;
