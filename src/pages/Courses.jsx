import React, { useState, useEffect } from 'react';
import { fetchCourses } from '../services/api';
import CourseCard from '../components/CourseCard';
import { Search, Filter, Compass, AlertCircle, RefreshCw } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const categories = ['All', 'Web Development', 'Software Engineering', 'Computer Science'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (difficultyFilter !== 'All') params.difficulty = difficultyFilter;

      const data = await fetchCourses(params);
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, difficultyFilter]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-8 md:p-10 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Course Catalog</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Explore Available Courses
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Discover structured learning paths designed by industry experts. Build real-world skills in web development, Java programming, algorithms, and software engineering.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-slate-900/80 p-4 md:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses, skills, or instructors..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 md:flex-initial">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  Difficulty: {diff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content State Handling */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/60 rounded-2xl h-96 border border-slate-800 animate-pulse p-4 space-y-4">
              <div className="w-full h-48 bg-slate-800 rounded-xl" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Unable to load courses</h3>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={loadCourses}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <Compass className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No courses match your criteria</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try resetting your search query or category filters to discover available courses.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
              setDifficultyFilter('All');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
