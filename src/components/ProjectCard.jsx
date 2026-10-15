import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Briefcase,
  ArrowRight,
  Star,
  Layers,
  Users,
  CheckCircle,
  Play,
  Building2,
} from 'lucide-react';

const ProjectCard = ({ project, studentProgress, onStart }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = () => {
    if (!studentProgress) return null;
    if (studentProgress.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (studentProgress.status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
          <Play className="w-3 h-3" /> In Progress
        </span>
      );
    }
    return null;
  };

  const getCompanyTypeIcon = (type) => {
    switch (type) {
      case 'Startup': return '🚀';
      case 'Mid-size': return '🏢';
      case 'Enterprise': return '🏛️';
      case 'Open Source': return '🌐';
      case 'Freelance': return '💼';
      default: return '🏢';
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-violet-300 transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Thumbnail with overlay */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border border-slate-200/80">
            {project.category}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${getDifficultyColor(
              project.difficulty
            )} shadow-sm`}
          >
            {project.difficulty}
          </span>
        </div>

        {/* Bottom-left: industry tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/50 backdrop-blur-md text-white flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {project.industry}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Content body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
            {project.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Skills tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.skills?.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100"
              >
                {skill}
              </span>
            ))}
            {project.skills?.length > 4 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100">
                +{project.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Meta info row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.milestones?.length || 0} Steps</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span>{getCompanyTypeIcon(project.companyType)}</span>
            <span>{project.companyType}</span>
          </div>
        </div>

        {/* Progress bar (if started) */}
        {studentProgress && studentProgress.status !== 'not_started' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Progress</span>
              <span className="font-bold text-violet-600">{studentProgress.progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${studentProgress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action button */}
        {studentProgress?.status === 'in_progress' ? (
          <Link
            to={`/internship-projects/${project._id}`}
            className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-violet-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Continue Project
          </Link>
        ) : studentProgress?.status === 'completed' ? (
          <Link
            to={`/internship-projects/${project._id}`}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 border border-emerald-200"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Review Project
          </Link>
        ) : (
          <Link
            to={`/internship-projects/${project._id}`}
            className="w-full py-2.5 px-4 rounded-xl bg-violet-50 group-hover:bg-violet-600 text-violet-700 group-hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
