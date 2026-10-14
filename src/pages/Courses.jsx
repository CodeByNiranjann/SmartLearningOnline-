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

  const [categories, setCategories] = useState([
    'All',
    'Web Development',
    'Software Engineering',
    'Computer Science',
    'Data Science',
    'Other',
  ]);
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

      if (data && data.length > 0) {
        const distinct = Array.from(new Set(data.map((c) => c.category).filter(Boolean)));
        setCategories((prev) => Array.from(new Set([...prev, ...distinct])));
      }
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
    <div className="space-y-8 font-sans">
      {/* Header Banner (Matching LearnHub Figma Design) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Course Catalog</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Explore All Courses
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Discover structured learning paths designed by industry experts. Build real-world skills in web development, algorithms, and software engineering.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses, skills, or instructors..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
              className="w-full md:w-auto px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
            <div key={n} className="bg-white rounded-2xl h-80 border border-slate-200 animate-pulse p-4 space-y-4">
              <div className="w-full h-40 bg-slate-100 rounded-xl" />
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Unable to load courses</h3>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={loadCourses}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-3">
          <Compass className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No courses match your criteria</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try resetting your search query or category filters to discover available courses.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
              setDifficultyFilter('All');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
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
