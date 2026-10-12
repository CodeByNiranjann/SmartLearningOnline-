import React from 'react';
import { Video, FileText, BookOpen, FileCode, GitBranch, StickyNote, Globe, ExternalLink } from 'lucide-react';

const ResourceCard = ({ resource }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'Video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'Article':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'Documentation':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'PDF':
        return <FileCode className="w-5 h-5 text-amber-400" />;
      case 'GitHub':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      case 'Notes':
        return <StickyNote className="w-5 h-5 text-yellow-400" />;
      case 'Website':
      default:
        return <Globe className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Video':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'Article':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'Documentation':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'PDF':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'GitHub':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'Notes':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      case 'Website':
      default:
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 group shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 group-hover:scale-105 transition-transform">
            {getResourceIcon(resource.type)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
              {resource.title}
            </h4>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgeColor(resource.type)}`}>
              {resource.type}
            </span>
          </div>
        </div>
      </div>

      {resource.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      )}

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 px-3 rounded-lg bg-slate-700/60 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>Open Resource</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

export default ResourceCard;
