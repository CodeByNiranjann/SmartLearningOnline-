import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects, fetchMyProjects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderGit2,
  Search,
  Filter,
  Clock,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trophy,
  Layers,
  FileCheck,
  Send,
  Loader2,
  CheckSquare,
  BookOpen,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  in_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_revision: 'bg-rose-50 text-rose-700 border-rose-200',
};

const Projects = () => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProjectsList, setMyProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Primary Tab
  const [currentView, setCurrentView] = useState('all'); // 'all' or 'my'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    loadAllProjects();
    if (isAuthenticated) {
      loadMyProjects();
    }
  }, [isAuthenticated]);

  const loadAllProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Unable to load real-world projects. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyProjects = async () => {
    try {
      const data = await fetchMyProjects();
      setMyProjectsList(data.projects || []);
    } catch (err) {
      console.error('Failed to load my projects:', err);
    }
  };

  // Derive categories and technologies from loaded projects
  const activeDataset = currentView === 'my' ? myProjectsList : projects;
  const categories = ['All', ...new Set(activeDataset.map((p) => p.category).filter(Boolean))];

  // Extract all unique technologies
  const allTechs = [
    'All',
    ...new Set(
      activeDataset
        .flatMap((p) => p.technologies || [])
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ];

  // Filtering Logic
  const filteredProjects = activeDataset.filter((project) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      project.title?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term) ||
      (project.technologies && project.technologies.some((t) => t.toLowerCase().includes(term))) ||
      (project.requiredSkills && project.requiredSkills.some((s) => s.toLowerCase().includes(term)));

    const matchesDifficulty =
      selectedDifficulty === 'All' || project.difficulty === selectedDifficulty;

    const matchesCategory =
      selectedCategory === 'All' || project.category === selectedCategory;

    const matchesTech =
      selectedTech === 'All' ||
      (project.technologies && project.technologies.some((t) => t.toLowerCase() === selectedTech.toLowerCase()));

    let matchesStatus = true;
    if (selectedStatus !== 'All') {
      const pStatus = project.myEnrollment?.status || (project.mySubmission ? 'submitted' : 'not_started');
      matchesStatus = pStatus === selectedStatus;
    }

    return matchesSearch && matchesDifficulty && matchesCategory && matchesTech && matchesStatus;
  });

  // Calculate statistics
  const totalProjects = projects.length;
  const enrolledCount = myProjectsList.length;
  const completedCount = myProjectsList.filter(
    (p) => p.myEnrollment?.status === 'completed' || p.mySubmission?.status === 'graded'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Hero Section ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-8 sm:p-12 shadow-xl mb-10 border border-slate-800">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              SLP-6 • Real-World Practical Projects
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Real-World Capstone & Practical Projects
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              Transition theory into job-ready engineering. Join production projects, follow ordered milestones, submit your repositories and live deployments, and receive evaluation feedback from expert instructors.
            </p>

            {/* Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-white">{totalProjects}</span>
                <span className="text-xs text-slate-300 font-medium">Industry Projects</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-blue-300">
                  {isAuthenticated ? enrolledCount : '100%'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isAuthenticated ? 'Enrolled Projects' : 'Industry Scenarios'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-emerald-300">
                  {isAuthenticated ? completedCount : 'Full-Stack'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isAuthenticated ? 'Completed Capstones' : 'Portfolio Ready'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <span className="block text-2xl sm:text-3xl font-bold text-amber-300">100 Pts</span>
                <span className="text-xs text-slate-300 font-medium">Verified Evaluation</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── View Switcher (All Projects vs My Projects) ─── */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setCurrentView('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentView === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Explore All Projects ({projects.length})
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setCurrentView('my')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                currentView === 'my'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              My Joined Projects ({myProjectsList.length})
            </button>
          )}
        </div>

        {/* ─── Search & Filtering Toolbar ─── */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, technologies (React, Docker, Node.js)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Difficulty Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Difficulty:</span>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Technology Filter */}
            {allTechs.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Technology:</span>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allTechs.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="needs_revision">Needs Revision</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ─── Projects Grid ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading real-world projects...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8">
            <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {currentView === 'my' ? 'No Joined Projects Yet' : 'No Projects Match Your Filter'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
              {currentView === 'my'
                ? 'Explore published projects and click "Join This Project" to begin building.'
                : 'Try adjusting your search keywords, difficulty, or track filters to explore more projects.'}
            </p>
            {currentView === 'my' ? (
              <button
                onClick={() => setCurrentView('all')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Browse All Projects
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('All');
                  setSelectedCategory('All');
                  setSelectedTech('All');
                  setSelectedStatus('All');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const enrollment = project.myEnrollment;
              const isEnrolled = !!enrollment;
              const statusKey = enrollment?.status || (project.mySubmission ? 'submitted' : null);

              return (
                <div
                  key={project._id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col group"
                >
                  {/* Card Thumbnail Banner */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          DIFFICULTY_COLORS[project.difficulty] || 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {project.difficulty}
                      </span>

                      {/* Enrollment / Submission state badge */}
                      {statusKey ? (
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            STATUS_COLORS[statusKey] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {statusKey.replace('_', ' ').toUpperCase()}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900/70 text-slate-200 backdrop-blur-sm">
                          {project.totalPoints || 100} Pts
                        </span>
                      )}
                    </div>

                    {/* Category Label at bottom of image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-semibold text-blue-200 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {project.category}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        ~{project.estimatedHours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {project.title}
                      </h2>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tech Stack Chips */}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.technologies.slice(0, 4).map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-medium text-slate-400">
                              +{project.technologies.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Required Skills Chips */}
                      {project.requiredSkills && project.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {project.requiredSkills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress Bar if Enrolled */}
                      {enrollment && enrollment.totalMilestones > 0 && (
                        <div className="mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-semibold">
                            <span>Milestone Progress</span>
                            <span>{enrollment.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${enrollment.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Associated Course & Action Button */}
                    <div className="pt-3 border-t border-slate-100 mt-auto">
                      {project.courseId && (
                        <div className="text-[11px] text-slate-500 mb-3 truncate">
                          Course:{' '}
                          <span className="font-semibold text-slate-700">
                            {project.courseId.title}
                          </span>
                        </div>
                      )}

                      <Link
                        to={`/projects/${project._id}`}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          isEnrolled
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                        }`}
                      >
                        {isEnrolled ? (
                          <>
                            <Code2 className="w-4 h-4 text-blue-600" />
                            Continue Project Milestones
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Explore & Join Project
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 ml-0.5 opacity-70" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
