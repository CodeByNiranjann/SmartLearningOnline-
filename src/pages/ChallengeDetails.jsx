import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchChallengeDetails,
  submitChallengeCode,
  fetchChallengeSolution,
  fetchMyChallengeAttempts,
} from '../services/api';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  Award,
  Building2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const difficultyColors = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const ChallengeDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [editorialSolution, setEditorialSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'solution' | 'submissions'
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const data = await fetchChallengeDetails(id);
      setChallenge(data);
      setCode(data.starterCode?.javascript || '');

      if (user) {
        try {
          const prev = await fetchMyChallengeAttempts(id);
          setAttempts(prev || []);
        } catch (e) {
          console.error('Failed to load past attempts:', e);
        }
      }
    } catch (err) {
      console.error('Error loading challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCode = () => {
    if (challenge && challenge.starterCode) {
      setCode(challenge.starterCode[language] || '');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmissionResult(null);
      const res = await submitChallengeCode(id, {
        code,
        language,
        hintsUsed: hintsRevealed,
      });
      setSubmissionResult(res);

      if (user) {
        const prev = await fetchMyChallengeAttempts(id);
        setAttempts(prev || []);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setSubmissionResult({
        status: 'runtime_error',
        allPassed: false,
        results: [{ error: err.response?.data?.message || err.message || 'Execution failed' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSolution = async () => {
    if (editorialSolution) {
      setActiveTab('solution');
      return;
    }
    try {
      setLoadingSolution(true);
      const sol = await fetchChallengeSolution(id);
      setEditorialSolution(sol);
      setActiveTab('solution');
    } catch (err) {
      console.error('Error fetching editorial solution:', err);
    } finally {
      setLoadingSolution(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <p className="text-lg">Challenge not found.</p>
        <Link to="/coding-challenges" className="mt-4 text-indigo-400 hover:underline">
          Return to Arena
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/coding-challenges"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Arena
          </Link>
          <div className="h-4 w-[1px] bg-slate-700" />
          <h2 className="text-sm font-semibold text-white">{challenge.title}</h2>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
              difficultyColors[challenge.difficulty]
            }`}
          >
            {challenge.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>{challenge.points || 10} points</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Submit Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace (Split View) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Problem description, hints, submissions */}
        <div className="lg:col-span-5 border-r border-slate-800 bg-slate-900/40 flex flex-col h-[calc(100vh-57px)] overflow-y-auto">
          {/* Tab Header */}
          <div className="flex border-b border-slate-800 px-4 pt-2 bg-slate-900/60 sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Description
            </button>
            <button
              onClick={handleViewSolution}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'solution'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Editorial & Hints
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'submissions'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Submissions ({attempts.length})
            </button>
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'description' && (
              <>
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">{challenge.title}</h1>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {challenge.problemStatement}
                  </p>
                </div>

                {/* Examples */}
                {challenge.examples?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Examples
                    </h3>
                    {challenge.examples.map((ex, i) => (
                      <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                        <p className="text-slate-400">
                          <strong className="text-slate-200">Input:</strong> {ex.input}
                        </p>
                        <p className="text-slate-400">
                          <strong className="text-slate-200">Output:</strong> {ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="text-slate-500 font-sans mt-1">{ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {challenge.constraints?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                      {challenge.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Company Tags */}
                {challenge.companyTags?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Interviewed at
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {challenge.companyTags.map((company, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 rounded text-xs"
                        >
                          <Building2 className="w-3 h-3" />
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-6">
                {/* Hints section */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Progressive Hints
                  </h3>

                  <div className="space-y-3">
                    {challenge.hints?.map((hint, idx) => (
                      <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs">
                        {hintsRevealed > idx ? (
                          <p className="text-slate-300">{hint}</p>
                        ) : (
                          <button
                            onClick={() => setHintsRevealed(idx + 1)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Reveal Hint #{idx + 1} (-2 points)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editorial */}
                {loadingSolution ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-20 bg-slate-800 rounded" />
                  </div>
                ) : editorialSolution ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Optimal Approach & Complexity
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
                      {editorialSolution.approachExplanation}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                        <span className="text-slate-500 block">Time Complexity</span>
                        <span className="text-emerald-400 font-mono">{editorialSolution.timeComplexity || 'O(n)'}</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                        <span className="text-slate-500 block">Space Complexity</span>
                        <span className="text-cyan-400 font-mono">{editorialSolution.spaceComplexity || 'O(1)'}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1">Reference Solution</h4>
                      <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {editorialSolution.solution?.javascript}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Submission History
                </h3>
                {attempts.length === 0 ? (
                  <p className="text-xs text-slate-500">No submissions yet for this challenge.</p>
                ) : (
                  attempts.map((att) => (
                    <div
                      key={att._id}
                      className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {att.status === 'accepted' ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> {att.status}
                            </span>
                          )}
                          <span className="text-slate-500 font-mono text-[11px]">
                            {att.passedCount}/{att.totalTests} tests passed
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {new Date(att.createdAt).toLocaleString()} · {att.executionTime}ms
                        </p>
                      </div>

                      {att.pointsEarned > 0 && (
                        <span className="text-amber-400 font-medium">+{att.pointsEarned} pts</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Test Runner Results */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-57px)] bg-slate-950">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-300">Language:</span>
              <span className="text-indigo-400 font-semibold">JavaScript (Node.js runtime)</span>
            </div>

            <button
              onClick={handleResetCode}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Starter
            </button>
          </div>

          {/* Interactive Code Editor (Textarea with monospace font) */}
          <div className="flex-1 p-3 bg-slate-950">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-full bg-slate-900/80 text-indigo-100 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              placeholder="// Write your algorithm solution function here..."
            />
          </div>

          {/* Test Runner / Output Terminal */}
          <div className="h-60 border-t border-slate-800 bg-slate-900/90 flex flex-col">
            <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Test Suite & Output
              </span>

              {submissionResult && (
                <span
                  className={`font-semibold ${
                    submissionResult.allPassed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {submissionResult.allPassed
                    ? `Accepted (+${submissionResult.pointsEarned} pts)`
                    : 'Wrong Answer / Errors'}
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {!submissionResult ? (
                <p className="text-slate-500">Run or Submit code to see test execution results.</p>
              ) : (
                <div className="space-y-3">
                  {submissionResult.results?.map((res, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded border ${
                        res.passed
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">
                          Test Case #{idx + 1} {res.isHidden && '(Hidden)'}
                        </span>
                        <span>{res.passed ? 'PASSED' : 'FAILED'}</span>
                      </div>
                      {res.error ? (
                        <p className="text-rose-400">{res.error}</p>
                      ) : (
                        <div className="space-y-0.5 text-[11px] text-slate-400">
                          <div>Expected: {res.expectedOutput}</div>
                          <div>Actual: {res.actualOutput}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetails;
