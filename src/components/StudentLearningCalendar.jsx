import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Flame,
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Info,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { fetchLearningCalendar, logStudyTime, seedCalendarActivity } from '../services/api';

const PALETTES = {
  emerald: {
    name: 'Emerald Green',
    levels: [
      'bg-slate-100 border-slate-200 text-slate-600',
      'bg-emerald-200 border-emerald-300 text-emerald-800',
      'bg-emerald-400 border-emerald-500 text-emerald-950 font-medium',
      'bg-emerald-600 border-emerald-700 text-white font-medium',
      'bg-emerald-800 border-emerald-900 text-white font-bold shadow-sm',
    ],
    ring: 'ring-emerald-500',
    indicator: 'bg-emerald-500',
    accentText: 'text-emerald-600',
  },
  indigo: {
    name: 'Indigo Blue',
    levels: [
      'bg-slate-100 border-slate-200 text-slate-600',
      'bg-indigo-200 border-indigo-300 text-indigo-800',
      'bg-indigo-400 border-indigo-500 text-indigo-950 font-medium',
      'bg-indigo-600 border-indigo-700 text-white font-medium',
      'bg-indigo-800 border-indigo-900 text-white font-bold shadow-sm',
    ],
    ring: 'ring-indigo-500',
    indicator: 'bg-indigo-500',
    accentText: 'text-indigo-600',
  },
  amber: {
    name: 'Warm Amber',
    levels: [
      'bg-slate-100 border-slate-200 text-slate-600',
      'bg-amber-200 border-amber-300 text-amber-800',
      'bg-amber-400 border-amber-500 text-amber-950 font-medium',
      'bg-amber-500 border-amber-600 text-white font-medium',
      'bg-amber-700 border-amber-800 text-white font-bold shadow-sm',
    ],
    ring: 'ring-amber-500',
    indicator: 'bg-amber-500',
    accentText: 'text-amber-600',
  },
};

function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0 mins';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const StudentLearningCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarData, setCalendarData] = useState({
    summary: {
      totalMinutes: 0,
      totalHours: '0.0',
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalLessonsCompleted: 0,
      averageMinutesPerActiveDay: 0,
    },
    activities: {},
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' is primary view per design
  const [colorTheme, setColorTheme] = useState('emerald');
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activePalette = PALETTES[colorTheme] || PALETTES.emerald;

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchLearningCalendar();
      setCalendarData(data);

      // Pre-select today's date
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayActivity = data.activities?.[todayStr] || {
        date: todayStr,
        durationMinutes: 0,
        lessonsCompleted: 0,
        level: 0,
      };
      setSelectedDay(todayActivity);
    } catch (err) {
      console.error('Error loading learning calendar:', err);
      setError('Could not load calendar activity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick action: Simulate or Log active study time
  const handleLogQuickStudy = async (minutesToAdd = 20) => {
    try {
      setActionLoading(true);
      await logStudyTime({ minutes: minutesToAdd });
      await loadData();
    } catch (err) {
      console.error('Error logging study time:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Seed sample data for demonstration
  const handleSeedDemo = async () => {
    try {
      setActionLoading(true);
      await seedCalendarActivity();
      await loadData();
    } catch (err) {
      console.error('Error seeding demo activity:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Navigation for Month View
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Generate Month Grid Days
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        activity: calendarData.activities?.[dateStr] || { durationMinutes: 0, level: 0 },
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        activity: calendarData.activities?.[dateStr] || { durationMinutes: 0, level: 0 },
      });
    }

    // Next month filler days (fill to complete 35 or 42 grid cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        activity: calendarData.activities?.[dateStr] || { durationMinutes: 0, level: 0 },
      });
    }

    return days;
  }, [currentDate, calendarData.activities]);

  // Build month-grouped heatmap from start of current year → end of 2028
  const heatmapMonths = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const startYear = today.getFullYear();
    const endYear = 2028;
    const months = [];

    for (let year = startYear; year <= endYear; year++) {
      const startMonth = 0; // always January
      const endMonth = 11;  // always December

      for (let month = startMonth; month <= endMonth; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

        // Build grid: leading empty cells + day cells
        // Each "week" column is Sun(0)..Sat(6)
        const label = new Date(year, month, 1).toLocaleDateString('en-US', {
          month: 'short',
        });
        const yearLabel = month === 0 ? String(year) : null; // show year only in January

        // Create a flat array of cells (nulls for padding, then day objects)
        const cells = [];
        for (let pad = 0; pad < firstDayOfWeek; pad++) {
          cells.push(null); // empty leading cell
        }
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          cells.push({
            dateStr,
            day,
            isToday,
            isFuture,
            activity: calendarData.activities?.[dateStr] || { durationMinutes: 0, level: 0 },
          });
        }

        // Split cells into week columns (each column = 7 rows: Sun–Sat)
        const numCols = Math.ceil(cells.length / 7);
        const weekCols = [];
        for (let col = 0; col < numCols; col++) {
          const colCells = cells.slice(col * 7, col * 7 + 7);
          // Pad end of last column to always have 7 rows
          while (colCells.length < 7) colCells.push(null);
          weekCols.push(colCells);
        }

        months.push({ label, yearLabel, year, month, weekCols });
      }
    }

    return months;
  }, [calendarData.activities]);

  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* 1. Header Banner & High-Level Stats */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learning Activity & Time Tracker</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Study Calendar & Consistency
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Track daily learning minutes spent on the platform. Shaded from light to dark based on study intensity.
            </p>
          </div>

          {/* Quick Study Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleLogQuickStudy(25)}
              disabled={actionLoading}
              title="Add 25 mins of active study time to today's calendar"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+25m Study Session</span>
            </button>

            {calendarData.summary.activeDays === 0 && (
              <button
                onClick={handleSeedDemo}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Load Sample Habits</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Current Streak</p>
              <p className="text-xl font-bold text-white">
                {calendarData.summary.currentStreak}{' '}
                <span className="text-xs font-normal text-slate-300">days</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Total Learning</p>
              <p className="text-xl font-bold text-white">
                {calendarData.summary.totalHours}{' '}
                <span className="text-xs font-normal text-slate-300">hrs</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Active Days</p>
              <p className="text-xl font-bold text-white">
                {calendarData.summary.activeDays}{' '}
                <span className="text-xs font-normal text-slate-300">days</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Longest Streak</p>
              <p className="text-xl font-bold text-white">
                {calendarData.summary.longestStreak}{' '}
                <span className="text-xs font-normal text-slate-300">days</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: View Toggle & Palette */}
      <div className="p-4 md:px-8 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 text-xs font-semibold">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Calendar
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'heatmap'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activity Heatmap
          </button>
        </div>

        {/* Color Palette Switcher */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Color Theme:</span>
          <div className="flex items-center gap-1.5">
            {Object.keys(PALETTES).map((key) => {
              const pal = PALETTES[key];
              const isSelected = colorTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'border-slate-800 bg-white text-slate-900 shadow-sm ring-1 ring-slate-800'
                      : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${pal.levels[3]}`} />
                  <span>{pal.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Calendar View Body */}
      <div className="p-6 md:p-8 space-y-6">
        {viewMode === 'month' ? (
          /* ─── Monthly Calendar Grid ─── */
          <div className="space-y-4">
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">{monthTitle}</h3>
                <button
                  onClick={handleCurrentMonth}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels (Sun to Sat) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* 7-column Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {monthCalendarDays.map((cell, idx) => {
                const act = cell.activity;
                const level = act?.level || 0;
                const isSelected = selectedDay?.date === cell.dateStr;
                const isToday = cell.dateStr === todayStr;
                const colorClasses = activePalette.levels[level];

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedDay({
                        date: cell.dateStr,
                        durationMinutes: act?.durationMinutes || 0,
                        lessonsCompleted: act?.lessonsCompleted || 0,
                        level,
                      })
                    }
                    onMouseEnter={() =>
                      setHoveredDay({
                        date: cell.dateStr,
                        durationMinutes: act?.durationMinutes || 0,
                        lessonsCompleted: act?.lessonsCompleted || 0,
                        level,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative min-h-[58px] sm:min-h-[76px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 ${colorClasses} ${
                      cell.isCurrentMonth ? 'opacity-100' : 'opacity-30'
                    } ${
                      isSelected
                        ? 'ring-2 ring-blue-600 ring-offset-2 scale-[1.02] shadow-md z-10'
                        : 'hover:scale-[1.02] hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Date Number & Today Indicator */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          level >= 3 ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Today" />
                      )}
                    </div>

                    {/* Bottom: Study minutes badge */}
                    {act?.durationMinutes > 0 ? (
                      <div className="mt-auto">
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none ${
                            level >= 3 ? 'bg-black/25 text-white' : 'bg-white/80 text-slate-800'
                          }`}
                        >
                          {formatMinutes(act.durationMinutes)}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-auto text-[10px] text-slate-400 font-normal">
                        —
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── Month-by-Month Heatmap (Jan current year → Dec 2028) ─── */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Study Activity Heatmap</h3>
                <p className="text-xs text-slate-500">
                  {new Date().getFullYear()} → 2028 · Each cell = one day · Gap between months
                </p>
              </div>
            </div>

            {/* Scrollable heatmap container */}
            <div className="overflow-x-auto pb-4">
              <div className="inline-flex gap-4 min-w-max">

                {heatmapMonths.map((mon, mIdx) => (
                  <div key={mIdx} className="flex flex-col">

                    {/* Month + Year label */}
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        {mon.label}
                      </span>
                      {mon.yearLabel && (
                        <span className="text-[10px] font-semibold text-blue-500">
                          {mon.yearLabel}
                        </span>
                      )}
                    </div>

                    {/* Grid: vertical day labels on LEFT + week columns on RIGHT */}
                    <div className="flex gap-1">

                      {/* Vertical S M T W T F S labels */}
                      <div className="flex flex-col gap-1 mr-0.5">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                          <span
                            key={i}
                            className="w-3 h-3.5 sm:h-4 text-[8px] font-semibold text-slate-400 flex items-center justify-center leading-none"
                          >
                            {/* Only show S, W, S to avoid crowding (odd rows) */}
                            {i % 2 === 0 ? d : ''}
                          </span>
                        ))}
                      </div>

                      {/* Week columns */}
                      <div className="flex gap-1">
                        {mon.weekCols.map((col, cIdx) => (
                          <div key={cIdx} className="flex flex-col gap-1">
                            {col.map((cell, rIdx) => {
                              if (!cell) {
                                return (
                                  <div
                                    key={rIdx}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm"
                                  />
                                );
                              }
                              const act = cell.activity;
                              const level = cell.isFuture ? 0 : act?.level || 0;
                              const colorClasses = cell.isFuture
                                ? 'bg-slate-100 border border-dashed border-slate-200'
                                : activePalette.levels[level];
                              const isSelected = selectedDay?.date === cell.dateStr;

                              return (
                                <div
                                  key={rIdx}
                                  onClick={() =>
                                    !cell.isFuture &&
                                    setSelectedDay({
                                      date: cell.dateStr,
                                      durationMinutes: act?.durationMinutes || 0,
                                      lessonsCompleted: act?.lessonsCompleted || 0,
                                      level,
                                    })
                                  }
                                  onMouseEnter={() =>
                                    !cell.isFuture &&
                                    setHoveredDay({
                                      date: cell.dateStr,
                                      durationMinutes: act?.durationMinutes || 0,
                                      lessonsCompleted: act?.lessonsCompleted || 0,
                                      level,
                                    })
                                  }
                                  onMouseLeave={() => setHoveredDay(null)}
                                  title={`${cell.dateStr}${!cell.isFuture ? ': ' + formatMinutes(act?.durationMinutes) : ' (future)'}`}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border cursor-pointer transition-all duration-100
                                    ${colorClasses}
                                    ${cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                                    ${isSelected ? 'ring-2 ring-blue-600 scale-125 z-10' : cell.isFuture ? '' : 'hover:scale-110 hover:z-10'}
                                  `}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                ))}

              </div>
            </div>
          </div>
        )}

        {/* 4. Color Scale Legend — matches Figma "Hours studied · Less [■■■■■] More" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/80 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Hours studied</span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Less</span>
            {activePalette.levels.map((cls, i) => (
              <div
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border ${cls}`}
                title={i === 0 ? 'No activity' : i === 1 ? '1–20 min' : i === 2 ? '21–45 min' : i === 3 ? '46–75 min' : '75+ min'}
              />
            ))}
            <span className="text-[11px] text-slate-600 font-medium">More</span>
            <span className="ml-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-slate-400">Today</span>
            </span>
          </div>
        </div>

        {/* 5. Selected Day Detail Banner */}
        {selectedDay && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-900">
                  {formatDateDisplay(selectedDay.date)}
                </span>
                {selectedDay.date === todayStr && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    TODAY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Study Time:{' '}
                <span className="font-bold text-slate-900">
                  {formatMinutes(selectedDay.durationMinutes)}
                </span>
                {selectedDay.lessonsCompleted > 0 && (
                  <span>
                    {' '}
                    • Lessons Completed:{' '}
                    <span className="font-bold text-slate-900">
                      {selectedDay.lessonsCompleted}
                    </span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLogQuickStudy(15)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              >
                +15m Quick Study
              </button>
              <button
                onClick={() => handleLogQuickStudy(45)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
              >
                +45m Deep Work
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLearningCalendar;
