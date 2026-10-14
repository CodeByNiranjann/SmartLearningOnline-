import React from 'react';
import { Video, FileText, BookOpen, FileCode, GitBranch, StickyNote, Globe, ExternalLink } from 'lucide-react';

const ResourceCard = ({ resource }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'Video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'Article':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Documentation':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'PDF':
        return <FileCode className="w-5 h-5 text-amber-600" />;
      case 'GitHub':
        return <GitBranch className="w-5 h-5 text-purple-600" />;
      case 'Notes':
        return <StickyNote className="w-5 h-5 text-amber-600" />;
      case 'Website':
      default:
        return <Globe className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Video':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Article':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Documentation':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PDF':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GitHub':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Notes':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Website':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 flex flex-col justify-between space-y-3 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform">
            {getResourceIcon(resource.type)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {resource.title}
            </h4>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(resource.type)}`}>
              {resource.type}
            </span>
          </div>
        </div>
      </div>

      {resource.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      )}

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>Open Resource</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

export default ResourceCard;
