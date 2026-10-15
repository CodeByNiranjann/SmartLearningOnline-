import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowRight, CheckCircle2, Award, Zap, Building2 } from 'lucide-react';

const difficultyColors = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const ChallengeCard = ({ challenge, isSolved, matchReason }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              difficultyColors[challenge.difficulty] || difficultyColors.Easy
            }`}
          >
            {challenge.difficulty}
          </span>
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>+{challenge.points || 10} pts</span>
          </div>
        </div>

        <Link to={`/coding-challenges/${challenge._id}`} className="block group-hover:text-indigo-400 transition-colors">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
            {challenge.title}
          </h3>
        </Link>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {challenge.description}
        </p>

        {matchReason && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md mb-3">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="line-clamp-1">{matchReason}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {challenge.tags?.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 rounded"
            >
              #{tag}
            </span>
          ))}
          {challenge.companyTags?.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 rounded">
              <Building2 className="w-3 h-3" />
              {challenge.companyTags[0]}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        {isSolved ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Solved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Code2 className="w-3.5 h-3.5" />
            {challenge.category}
          </span>
        )}

        <Link
          to={`/coding-challenges/${challenge._id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
        >
          {isSolved ? 'Review' : 'Solve'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ChallengeCard;
