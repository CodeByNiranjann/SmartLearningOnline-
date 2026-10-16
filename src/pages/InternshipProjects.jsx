import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchInternshipProjects,
  fetchRecommendedProjects,
} from '../services/api';
import ProjectCard from '../components/ProjectCard';
import {
  Briefcase,
  Sparkles,
  Search,
  Filter,
  SlidersHorizontal,
  Rocket,
  Target,
  GraduationCap,
  ArrowRight,
  ChevronDown,
  X,
  TrendingUp,
  BookOpen,
  Zap,
} from 'lucide-react';

const InternshipProjects = () => {
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState(isAuthenticated ? 'recommended' : 'all');
  const [allProjects, setAllProjects] = useState([]);
  const [recommendedData, setRecommendedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'recommended' && isAuthenticated) {
        const data = await fetchRecommendedProjects();
        setRecommendedData(data);
      } else {
        const params = {};
        if (filterDifficulty) params.difficulty = filterDifficulty;
        if (filterCategory) params.category = filterCategory;
        if (searchQuery) params.search = searchQuery;
        const data = await fetchInternshipProjects(params);
        setAllProjects(data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'all') loadData();
  };

  const handleApplyFilters = () => {
    if (activeTab === 'all') loadData();
  };

  const clearFilters = () => {
    setFilterDifficulty('');
    setFilterCategory('');
    setSearchQuery('');
    setTimeout(() => loadData(), 0);
  };

  const displayProjects =
    activeTab === 'recommended'
      ? recommendedData?.recommended || []
      : allProjects;

  const categories = [
    'Web Development',
    'Backend Development',
    'Data Science',
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 md:p-10 text-white overflow-hidden shadow-2xl shadow-violet-600/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-fuchsia-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
            <Rocket className="w-3.5 h-3.5" />
            <span>Career Preparation Hub — SLP-15</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Internship-Ready Projects 🚀
          </h1>
          <p className="text-violet-100 text-sm md:text-base leading-relaxed max-w-xl">
            Gain hands-on experience with real-world projects designed to prepare you for internships.
            Build your portfolio, master industry tools, and stand out to recruiters.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2 text-violet-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{displayProjects.length || '—'}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold">Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-violet-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">3</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold">Difficulty Levels</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-violet-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">5+</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold">Industries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs + Controls Bar ─── */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-white text-violet-700 shadow-md shadow-violet-500/10'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Recommended for You
            </button>
          )}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-violet-700 shadow-md shadow-violet-500/10'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            All Projects
          </button>
        </div>

        {/* Search + Filter row (only for "All Projects" tab) */}
        {activeTab === 'all' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, skill, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                showFilters || filterDifficulty || filterCategory
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(filterDifficulty || filterCategory) && (
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {(filterDifficulty ? 1 : 0) + (filterCategory ? 1 : 0)}
                </span>
              )}
            </button>

            <button
              onClick={handleApplyFilters}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              Search
            </button>
          </div>
        )}

        {/* Filter Dropdowns Panel */}
        {showFilters && activeTab === 'all' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-violet-600" />
                Filter Projects
              </h3>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="relative">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 cursor-pointer"
                  >
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Skill Profile Card (Recommended tab) */}
        {activeTab === 'recommended' && recommendedData?.studentProfile && (
          <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-purple-50 rounded-2xl border border-violet-200/60 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-violet-800">Your Skill Profile</h3>
            </div>
            <p className="text-xs text-violet-600/80">
              Projects are recommended based on your enrolled courses and learning activity.
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedData.studentProfile.categories?.map((cat, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-violet-700 border border-violet-200 shadow-sm"
                >
                  {cat}
                </span>
              ))}
              {recommendedData.studentProfile.skills?.slice(0, 8).map((skill, i) => (
                <span
                  key={`s-${i}`}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700"
                >
                  {skill}
                </span>
              ))}
              {recommendedData.studentProfile.maxDifficulty && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-violet-600 text-white">
                  Up to {recommendedData.studentProfile.maxDifficulty}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Project Grid ─── */}
      <div className="space-y-6">
        {activeTab === 'recommended' && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Recommended for You
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalized projects matched to your enrolled courses and skill level
              </p>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-violet-600" />
                All Internship Projects
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse all available hands-on projects for internship preparation
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {displayProjects.length} projects
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-full" />
                  <div className="h-3 bg-slate-100 rounded-lg w-5/6" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-5 w-14 bg-slate-100 rounded-md" />
                    <div className="h-5 w-14 bg-slate-100 rounded-md" />
                    <div className="h-5 w-14 bg-slate-100 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="bg-white border border-slate-200/80 p-12 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No projects found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {activeTab === 'recommended'
                ? 'Enroll in courses to get personalized project recommendations based on your learning path.'
                : 'Try adjusting your search or filter criteria to find projects.'}
            </p>
            {activeTab === 'recommended' && (
              <button
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Browse All Projects <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                studentProgress={project.studentProgress || null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipProjects;
