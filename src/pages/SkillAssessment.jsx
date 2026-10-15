import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchSkillAssessment, submitSkillAssessment } from '../services/api';
import {
  Brain,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const SkillAssessment = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, []);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await fetchSkillAssessment();
      setAssessment(data);
    } catch (err) {
      console.error('Failed to load assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await submitSkillAssessment({
        assessmentId: assessment.assessmentId,
        answers,
      });
      setResult(res);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <p>No active assessment available at this time.</p>
        <Link to="/skill-learning" className="mt-4 text-indigo-400 hover:underline">
          Return to Skill Journey
        </Link>
      </div>
    );
  }

  const questions = assessment.questions;
  const currentQ = questions[currentIdx];
  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100);

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold">
              Assessment Completed
            </span>
            <h1 className="text-3xl font-bold text-white mt-3">Diagnostic Results</h1>
            <p className="text-slate-400 text-sm mt-1">
              Your personalized learning track has been automatically updated.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
            <span className="text-xs uppercase text-slate-400 tracking-wider font-medium">Assigned Skill Level</span>
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 mt-2">
              {result.calculatedLevel} Tier
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">Overall Diagnostic Score: {result.overallScore}%</p>
          </div>

          <div className="space-y-3 text-left">
            <h3 className="text-xs uppercase font-semibold text-slate-400">Domain Breakdown</h3>
            {result.categoryLevels?.map((cat, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{cat.category}</span>
                <span className="text-indigo-400 font-semibold">{cat.level} ({cat.score}%)</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/skill-learning')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            Explore Calibrated Activities
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Progress */}
        <div className="flex items-center justify-between">
          <Link
            to="/skill-learning"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Journey
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {currentQ.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">Difficulty: {currentQ.difficulty}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.questionText}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ._id] === opt.index;
              return (
                <button
                  key={opt.index}
                  onClick={() => handleSelectOption(currentQ._id, opt.index)}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {submitting ? 'Evaluating...' : 'Submit Diagnostic'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessment;
