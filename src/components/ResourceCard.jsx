import React from 'react';
import {
  Video, FileText, BookOpen, FileCode, GitBranch, StickyNote,
  Globe, ExternalLink, Download, Eye, Image as ImageIcon, FileSpreadsheet, File,
} from 'lucide-react';
import { getResourceDownloadUrl, getResourcePreviewUrl } from '../services/api';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ResourceCard = ({ resource }) => {
  const isUploaded = Boolean(resource.storedFilename || resource.storagePath);
  const ext = (resource.fileExtension || '').toLowerCase();
  const typeLower = (resource.type || '').toLowerCase();

  const canPreview =
    typeLower === 'pdf' ||
    typeLower === 'image' ||
    typeLower === 'text' ||
    ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt'].includes(ext);

  const getResourceIcon = () => {
    switch (resource.type) {
      case 'Video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'Article':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Documentation':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'PDF':
        return <FileCode className="w-5 h-5 text-red-600" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-indigo-600" />;
      case 'Presentation':
        return <FileSpreadsheet className="w-5 h-5 text-orange-600" />;
      case 'Document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'GitHub':
        return <GitBranch className="w-5 h-5 text-purple-600" />;
      case 'Notes':
      case 'Text':
        return <StickyNote className="w-5 h-5 text-amber-600" />;
      case 'Website':
      default:
        return isUploaded ? <File className="w-5 h-5 text-indigo-600" /> : <Globe className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Video':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Article':
      case 'Document':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Documentation':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PDF':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Image':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Presentation':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'GitHub':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Notes':
      case 'Text':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Website':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const token = localStorage.getItem('token');
  const downloadUrl = isUploaded ? getResourceDownloadUrl(resource._id, token) : resource.url;
  const previewUrl = isUploaded ? getResourcePreviewUrl(resource._id, token) : resource.url;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 flex flex-col justify-between space-y-3 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform shrink-0">
            {getResourceIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate" title={resource.title}>
              {resource.title}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(resource.type)}`}>
                {resource.type}
              </span>
              {resource.fileExtension && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600 font-bold">
                  {resource.fileExtension.replace('.', '')}
                </span>
              )}
              {Boolean(resource.fileSizeBytes) && (
                <span className="text-[10px] text-slate-500 font-medium">
                  • {formatFileSize(resource.fileSizeBytes)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {resource.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      )}

      {resource.originalFilename && (
        <p className="text-[11px] text-slate-400 font-mono truncate" title={resource.originalFilename}>
          File: {resource.originalFilename}
        </p>
      )}

      {/* Actions */}
      <div className="pt-1">
        {isUploaded ? (
          <div className="flex items-center gap-2">
            {canPreview && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Preview file in browser"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </a>
            )}
            <a
              href={downloadUrl}
              download={resource.originalFilename || resource.title}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        ) : (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Resource</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
