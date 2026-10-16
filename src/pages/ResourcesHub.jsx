import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAllResources,
  fetchCourses,
  getResourceDownloadUrl,
  getResourcePreviewUrl,
} from '../services/api';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  ExternalLink,
  Eye,
  GitBranch,
  FileText,
  Video,
  FileCode,
  Globe,
  StickyNote,
  FileSpreadsheet,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderDown,
} from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getResourceIcon = (type) => {
  switch (type) {
    case 'Video':
      return <Video className="w-5 h-5 text-rose-500" />;
    case 'Article':
    case 'Document':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'Documentation':
      return <BookOpen className="w-5 h-5 text-emerald-500" />;
    case 'PDF':
      return <FileCode className="w-5 h-5 text-red-500" />;
    case 'GitHub':
      return <GitBranch className="w-5 h-5 text-purple-500" />;
    case 'Presentation':
      return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
    case 'Notes':
    case 'Text':
      return <StickyNote className="w-5 h-5 text-amber-500" />;
    case 'Website':
    default:
      return <Globe className="w-5 h-5 text-indigo-500" />;
  }
};

const getBadgeStyle = (type) => {
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
    case 'GitHub':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Presentation':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Notes':
    case 'Text':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Website':
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
};

const ResourcesHub = () => {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Bookmarks saved in local storage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('slp_bookmarked_resources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id];
      try {
        localStorage.setItem('slp_bookmarked_resources', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save bookmark:', err);
      }
      return next;
    });
  };

  const copyResourceLink = (resource) => {
    const url = resource.url || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(resource._id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [resData, courseData] = await Promise.all([
        fetchAllResources(),
        fetchCourses(),
      ]);
      setResources(resData || []);
      setCourses(courseData || []);
    } catch (err) {
      console.error('Error fetching learning resources:', err);
      setError('Could not load learning resources. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const docs = resources.filter((r) => r.type === 'Documentation').length;
    const github = resources.filter((r) => r.type === 'GitHub').length;
    const articles = resources.filter((r) => ['Article', 'Document', 'Notes'].includes(r.type)).length;
    const media = resources.filter((r) => ['Video', 'Presentation', 'PDF'].includes(r.type)).length;
    return {
      total: resources.length,
      docs,
      github,
      articles,
      media,
      bookmarkedCount: bookmarks.length,
    };
  }, [resources, bookmarks]);

  // Types list
  const availableTypes = useMemo(() => {
    const types = new Set(resources.map((r) => r.type).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      // Course filter
      if (selectedCourse !== 'All' && r.courseId?.toString() !== selectedCourse) {
        return false;
      }
      // Type filter
      if (selectedType !== 'All' && r.type !== selectedType) {
        return false;
      }
      // Bookmarked filter
      if (showOnlyBookmarked && !bookmarks.includes(r._id)) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const inTitle = r.title?.toLowerCase().includes(term);
        const inDesc = r.description?.toLowerCase().includes(term);
        const inCourse = r.courseTitle?.toLowerCase().includes(term);
        const inLesson = r.lessonTitle?.toLowerCase().includes(term);
        if (!inTitle && !inDesc && !inCourse && !inLesson) return false;
      }
      return true;
    });
  }, [resources, selectedCourse, selectedType, showOnlyBookmarked, bookmarks, searchTerm]);

  return (
    <div className="space-y-8 font-sans">
      {/* ─── HERO HEADER BANNER ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-8 md:p-10 shadow-xl shadow-blue-600/15 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold uppercase tracking-wider border border-white/20">
            <FolderDown className="w-3.5 h-3.5 text-blue-200" />
            <span>Learning Resources Hub · SLP-4</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            All Study Resources in One Place
          </h1>

          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Stop switching between tabs and platforms. Browse verified documentation, starter code repositories, slide decks, and cheat sheets curated across all your courses.
          </p>
        </div>
      </div>

      {/* ─── QUICK METRICS STRIP ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Materials</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-500">Curated across all courses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documentation</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.docs}</p>
          <p className="text-[11px] text-slate-500">Official specs & MDN guides</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Code & Repos</span>
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600">{stats.github}</p>
          <p className="text-[11px] text-slate-500">GitHub starter boilerplates</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Saved List</span>
            <Bookmark className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{stats.bookmarkedCount}</p>
          <p className="text-[11px] text-slate-500">Locally bookmarked items</p>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic, keyword, title, or filename (e.g. flexbox, binary tree, react)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Course Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="All">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Pills & Bookmarks Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {availableTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {t === 'All' ? `All Types (${resources.length})` : t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showOnlyBookmarked
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70'
            }`}
          >
            {showOnlyBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Saved ({bookmarks.length})</span>
          </button>
        </div>
      </div>

      {/* ─── RESOURCE CARDS GRID ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-8 rounded-2xl text-center space-y-3">
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Learning Resources Match Your Criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, switching course filter to "All", or selecting a different resource type.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCourse('All');
              setSelectedType('All');
              setShowOnlyBookmarked(false);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((resource) => {
            const isUploaded = Boolean(resource.storedFilename || resource.storagePath);
            const token = localStorage.getItem('token');
            const downloadUrl = isUploaded
              ? getResourceDownloadUrl(resource._id, token)
              : resource.url;
            const previewUrl = isUploaded
              ? getResourcePreviewUrl(resource._id, token)
              : resource.url;
            const isBookmarked = bookmarks.includes(resource._id);

            return (
              <div
                key={resource._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                {/* Header: Icon, Type Badge, Bookmark */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:scale-105 transition-transform shrink-0">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(
                            resource.type
                          )}`}
                        >
                          {resource.type}
                        </span>
                        {Boolean(resource.fileSizeBytes) && (
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                            • {formatFileSize(resource.fileSizeBytes)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleBookmark(resource._id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'text-slate-400 hover:text-amber-600 border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                      title={resource.title}
                    >
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  {/* Course & Lesson Breadcrumb */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">
                        {resource.courseTitle || 'Curriculum Course'}
                      </span>
                    </div>
                    {resource.lessonTitle && (
                      <div className="flex items-center gap-1.5 truncate pl-4 text-slate-400">
                        <span>↳</span>
                        <span className="truncate">{resource.lessonTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  {isUploaded ? (
                    <>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Preview in browser"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                      <a
                        href={downloadUrl}
                        download={resource.originalFilename || resource.title}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => copyResourceLink(resource)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Copy resource URL"
                  >
                    {copiedId === resource._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {resource.lessonId && resource.courseId && (
                    <Link
                      to={`/learning/${resource.courseId}/${resource.lessonId}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                      title="Jump to Lesson Workspace"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourcesHub;
