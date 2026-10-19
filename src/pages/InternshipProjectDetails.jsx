import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchProjectDetails,
  startProject,
  updateProjectProgress,
} from '../services/api';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Layers,
  Building2,
  Star,
  Target,
  CheckCircle,
  Circle,
  Play,
  Rocket,
  ExternalLink,
  GitBranch,
  BookOpen,
  Zap,
  ChevronRight,
  Award,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectDetails(projectId);
      setProject(data);

      // If authenticated, try to load student progress
      if (isAuthenticated) {
        try {
          const { fetchMyProjects } = await import('../services/api');
          const myProjects = await fetchMyProjects();
          const myProgress = myProjects.find(
            (p) => p.projectId?._id === projectId || p.projectId === projectId
          );
          if (myProgress) {
            setProgress(myProgress);
            setRepoUrl(myProgress.repositoryUrl || '');
            setNotes(myProgress.notes || '');
          }
        } catch (err) {
          // No progress yet — that's fine
        }
      }
    } catch (err) {
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setStarting(true);
    try {
      const result = await startProject(projectId);
      setProgress(result.progress);
    } catch (err) {
      console.error('Error starting project:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleToggleMilestone = async (milestoneIndex) => {
    if (!progress) return;
    setSaving(true);
    try {
      const current = progress.completedMilestones || [];
      let updated;
      if (current.includes(milestoneIndex)) {
        updated = current.filter((i) => i !== milestoneIndex);
      } else {
        updated = [...current, milestoneIndex];
      }

      const result = await updateProjectProgress(projectId, {
        completedMilestones: updated,
        notes,
        repositoryUrl: repoUrl,
      });
      setProgress(result.progress);
    } catch (err) {
      console.error('Error updating milestone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!progress) return;
    setSaving(true);
    try {
      const result = await updateProjectProgress(projectId, {
        completedMilestones: progress.completedMilestones || [],
        notes,
        repositoryUrl: repoUrl,
      });
      setProgress(result.progress);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-3xl" />
        <div className="h-8 bg-slate-100 rounded-xl w-1/2" />
        <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <Link
          to="/internship-projects"
          className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:text-violet-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Back Navigation ─── */}
      <Link
        to="/internship-projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Internship Projects
      </Link>

      {/* ─── Hero Section ─── */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
        </div>

        <div className="relative z-10 p-8 md:p-10 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-sm">
              {project.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(
                project.difficulty
              )} shadow-sm`}
            >
              {project.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {project.industry} • {project.companyType}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
            {project.title}
          </h1>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl">
            {project.description}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{project.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>{project.milestones?.length || 0} Milestones</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{project.completionCount || 0} completions</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Popularity: {project.popularity || 0}</span>
            </div>
          </div>

          {/* CTA */}
          {!progress ? (
            <button
              onClick={handleStartProject}
              disabled={starting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {starting ? 'Starting...' : 'Start This Project'}
            </button>
          ) : progress.status === 'completed' ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 backdrop-blur-md text-emerald-300 font-bold text-sm border border-emerald-400/30">
              <Award className="w-4 h-4" />
              Project Completed!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/20 backdrop-blur-md text-violet-200 font-bold text-sm border border-violet-400/30">
              <Play className="w-4 h-4" />
              In Progress — {progress.progressPercentage}% complete
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          {project.detailedOverview && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                Project Overview
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {project.detailedOverview}
              </p>
            </div>
          )}

          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-600" />
                Project Milestones
              </h2>
              {progress && (
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                  {progress.completedMilestones?.length || 0}/{project.milestones?.length || 0} done
                </span>
              )}
            </div>

            {/* Progress bar */}
            {progress && (
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              {project.milestones?.map((milestone, index) => {
                const isCompleted = progress?.completedMilestones?.includes(index);
                const canToggle = progress && progress.status === 'in_progress';

                return (
                  <div
                    key={index}
                    className={`relative pl-12 py-3 pr-4 rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? 'bg-violet-50/50 border-violet-200'
                        : 'bg-white border-slate-200/80 hover:border-violet-200'
                    }`}
                  >
                    {/* Node */}
                    <button
                      onClick={() => canToggle && handleToggleMilestone(index)}
                      disabled={!canToggle || saving}
                      className={`absolute left-2.5 top-4 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                        canToggle ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isCompleted
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          isCompleted ? 'text-violet-800 line-through decoration-violet-300' : 'text-slate-800'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Outcomes */}
          {project.learningOutcomes?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.learningOutcomes.map((outcome, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/50 border border-violet-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Notes & Repo (if started) */}
          {progress && progress.status !== 'not_started' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-violet-600" />
                Your Project Workspace
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/yourusername/project-repo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Project Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Track your thoughts, challenges, and learnings here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Skills & Tools Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              Skills & Tools
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Skills Required
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tools & Technologies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tools?.map((tool, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project Info Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Project Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-700">{project.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Difficulty</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getDifficultyColor(project.difficulty)}`}>
                  {project.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Industry</span>
                <span className="font-semibold text-slate-700">{project.industry}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Company Type</span>
                <span className="font-semibold text-slate-700">{project.companyType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Milestones</span>
                <span className="font-semibold text-slate-700">{project.milestones?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Completions</span>
                <span className="font-semibold text-slate-700">{project.completionCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Related Courses */}
          {project.relatedCourses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                Related Courses
              </h3>
              <div className="space-y-2">
                {project.relatedCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/courses/${course._id}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-violet-700 truncate">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-slate-500">{course.category}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Repository link */}
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all group"
            >
              <GitBranch className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-xs font-bold">Starter Repository</p>
                <p className="text-[10px] text-slate-400">Clone and start building</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
