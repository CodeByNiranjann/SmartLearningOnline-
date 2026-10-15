import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchSkillActivities,
  fetchSkillProfile,
  updateSkillProfile,
} from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import ProjectCard from '../components/ProjectCard';
import CourseCard from '../components/CourseCard';
import {
  Sparkles,
  Target,
  TrendingUp,
  Compass,
  CheckCircle2,
  Brain,
  Code2,
  Briefcase,
  Layers,
  Award,
  ArrowRight,
  ShieldAlert,
  Gauge,
  Sliders,
} from 'lucide-react';

const levelBadgeStyles = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

const SkillLearning = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState('all'); // 'all' | 'courses' | 'challenges' | 'projects'
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedPace, setSelectedPace] = useState('Balanced');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await fetchSkillActivities();
      setData(res);
      setSelectedLevel(res.currentLevel || 'Beginner');
      setSelectedPace(res.skillProfile?.preferredPace || 'Balanced');
      setSelectedGoal(res.skillProfile?.targetGoal || 'Placement Preparation & Practical Projects');
    } catch (err) {
      console.error('Error loading skill learning activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateSkillProfile({
        overallLevel: selectedLevel,
        preferredPace: selectedPace,
        targetGoal: selectedGoal,
      });
      setIsEditingProfile(false);
      await loadActivities();
    } catch (err) {
      console.error('Failed to update skill profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const profile = data?.skillProfile;
  const currentLevel = data?.currentLevel || 'Beginner';
  const activities = data?.activities || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-slate-900 border border-emerald-500/20 p-8 md:p-10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Sprint 4 · Personalized Skill-Level Engine
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              Adaptive Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">Journey</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Curriculum, coding challenges, and capstone projects dynamically calibrated to your exact skill level. Master concepts with zero friction and maximum placement efficiency.
            </p>
          </div>

          <div className="absolute -top-12 -right-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Skill Profile Card / Diagnostic CTA */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Gauge className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Your Assessed Level</h2>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                      levelBadgeStyles[currentLevel]
                    }`}
                  >
                    {currentLevel} Tier
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Goal: <span className="text-slate-200 font-medium">{profile?.targetGoal || 'Placement Preparation'}</span> · Pace: <span className="text-slate-200 font-medium">{profile?.preferredPace || 'Balanced'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                {isEditingProfile ? 'Cancel' : 'Adjust Preferences'}
              </button>

              <Link
                to="/skill-assessment"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Brain className="w-4 h-4" />
                {data?.assessmentCompleted ? 'Retake Skill Diagnostic' : 'Take Skill Diagnostic'}
              </Link>
            </div>
          </div>

          {/* Quick Adjustment Form */}
          {isEditingProfile && (
            <form onSubmit={handleUpdateProfile} className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Skill Tier</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner (Foundations & Syntax)</option>
                  <option value="Intermediate">Intermediate (Algorithms & Full-Stack)</option>
                  <option value="Advanced">Advanced (System Design & Distributed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Learning Pace</label>
                <select
                  value={selectedPace}
                  onChange={(e) => setSelectedPace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Gentle">Gentle (2-4 hrs/week)</option>
                  <option value="Balanced">Balanced (5-8 hrs/week)</option>
                  <option value="Intensive">Intensive (10+ hrs/week)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {savingProfile ? 'Saving...' : 'Apply Calibrations'}
                </button>
              </div>
            </form>
          )}

          {/* Domain Category Competency Breakdown */}
          {profile?.categoryLevels?.length > 0 && (
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile.categoryLevels.map((cat, i) => (
                <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 line-clamp-1">{cat.category}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        levelBadgeStyles[cat.level]
                      }`}
                    >
                      {cat.level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Proficiency</span>
                    <span>{cat.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tailored Learning Path Milestones */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Recommended Roadmap for {currentLevel} Tier
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activities.learningPath?.map((step) => (
              <div
                key={step.step}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-emerald-400 font-bold">STAGE 0{step.step}</span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-[11px] text-slate-300">
                    {step.type}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Selector for Calibrated Activities */}
        <div className="flex border-b border-slate-800 pb-3 gap-2">
          {[
            { id: 'all', label: 'All Calibrated Activities' },
            { id: 'challenges', label: `Coding Drills (${activities.challenges?.length || 0})` },
            { id: 'courses', label: `Matched Courses (${activities.courses?.length || 0})` },
            { id: 'projects', label: `Hands-on Projects (${activities.projects?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveActivityTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeActivityTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Activities Sections */}
        {(activeActivityTab === 'all' || activeActivityTab === 'challenges') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                Skill-Calibrated Coding Challenges
              </h3>
              <Link
                to="/coding-challenges"
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                Browse Arena <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.challenges?.map((ch) => (
                <ChallengeCard key={ch._id} challenge={ch} matchReason={`Calibrated for ${currentLevel}`} />
              ))}
            </div>
          </div>
        )}

        {(activeActivityTab === 'all' || activeActivityTab === 'courses') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Matched Curriculum Courses
              </h3>
              <Link
                to="/courses"
                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
              >
                All Courses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.courses?.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </div>
        )}

        {(activeActivityTab === 'all' || activeActivityTab === 'projects') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Industry Projects at your Level
              </h3>
              <Link
                to="/internship-projects"
                className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                All Projects <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.projects?.map((proj) => (
                <ProjectCard key={proj._id} project={proj} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillLearning;
