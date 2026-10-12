import React from 'react';

const ProgressBar = ({ percentage = 0, showLabel = true, size = 'md' }) => {
  const safePercentage = Math.min(100, Math.max(0, percentage));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Course Completion</span>
          <span className="text-indigo-400 font-bold">{safePercentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-700/80 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
