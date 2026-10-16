import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCodingChallenges,
  fetchRecommendedChallenges,
  fetchCodingStats,
} from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import {
  Code2,
  Sparkles,
  Trophy,
  Target,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';

const CodingChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [recommendedList, setRecommendedList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'all'
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [difficultyFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (difficultyFilter !== 'All') params.difficulty = difficultyFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [allRes, recRes, statsRes] = await Promise.allSettled([
        fetchCodingChallenges(params),
        user ? fetchRecommendedChallenges() : Promise.resolve({ recommended: [] }),
        user ? fetchCodingStats() : Promise.resolve(null),
      ]);

      if (allRes.status === 'fulfilled') setChallenges(allRes.value || []);
      if (recRes.status === 'fulfilled') setRecommendedList(recRes.value?.recommended || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value || null);
    } catch (err) {
      console.error('Error loading coding challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const solvedIds = new Set(
    stats?.recentAttempts?.filter((a) => a.status === 'accepted')?.map((a) => a.challengeId?._id) || []
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-8 md:p-10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Sprint 4 · Career Preparation Track
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              Placement Coding <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Arena</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Sharpen your problem-solving and algorithmic thinking with interview questions from top tech companies. Write code, pass automated test suites, and track placement readiness.
            </p>
          </div>

          <div className="absolute -top-12 -right-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Stats & Placement Readiness Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Solved Problems</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {stats.totalSolved} <span className="text-xs text-slate-500 font-normal">/ {stats.totalChallenges}</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Score</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.totalPoints} pts</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Placement Track</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-emerald-400 font-semibold">{stats.easy.solved}E</span>
                  <span className="text-xs text-amber-400 font-semibold">{stats.medium.solved}M</span>
                  <span className="text-xs text-rose-400 font-semibold">{stats.hard.solved}H</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Preparation Momentum</p>
                <h3 className="text-xl font-bold text-purple-400 mt-1">High Focus</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'recommended'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Recommended for You
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              All Challenges ({challenges.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search problems, tags, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    difficultyFilter === diff
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900/40 rounded-xl p-5 border border-slate-800 animate-pulse h-48" />
            ))}
          </div>
        ) : activeTab === 'recommended' ? (
          recommendedList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedList.map((item) => (
                <ChallengeCard
                  key={item.challenge._id}
                  challenge={item.challenge}
                  isSolved={item.isSolved}
                  matchReason={item.matchReason}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 p-8">
              <Zap className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No personalized recommendations yet</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Enroll in courses or browse the full challenge library to get custom tailored questions for your dream tech role.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                Browse All Challenges
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                isSolved={solvedIds.has(challenge._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingChallenges;
