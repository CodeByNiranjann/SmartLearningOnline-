import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Layers, ArrowRight, BookOpen } from 'lucide-react';

const CourseCard = ({ course }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="group bg-slate-800/80 rounded-2xl border border-slate-700/70 overflow-hidden shadow-xl hover:border-slate-600 transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        
        {/* Category & Difficulty Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-slate-700 shadow-md">
            {course.category}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${getDifficultyColor(course.difficulty)} shadow-md`}>
            {course.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">{course.instructor}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{course.moduleCount || 4} Modules</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <BookOpen className="w-3.5 h-3.5 text-pink-400" />
            <span>{course.lessonCount || 12} Lessons</span>
          </div>
        </div>

        {/* Action button */}
        <Link
          to={`/courses/${course._id}`}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-700/60 hover:bg-indigo-600 text-slate-200 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 group/btn transition-all duration-200 shadow-md"
        >
          <span>View Course</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
