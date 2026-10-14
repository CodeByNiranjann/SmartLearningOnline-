import React, { useState, useEffect } from 'react';
import { fetchInstructorStudents } from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import {
  GraduationCap,
  Search,
  Filter,
  BookOpen,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';

const InstructorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchInstructorStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Failed to retrieve enrolled students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Filtered list
  const uniqueCourses = Array.from(new Set(students.map((s) => s.courseTitle))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = courseFilter === 'all' || s.courseTitle === courseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            My Enrolled Students
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student learning velocity, current module checkpoints, and completion across your courses.
          </p>
        </div>

        <button
          onClick={loadStudents}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Filter & Search Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or course..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All My Courses</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Students Table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No students found</p>
            <p className="text-xs text-slate-400">
              No students enrolled under the selected course or search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Current Checkpoint</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {s.name ? s.name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-slate-400 text-[11px]">{s.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{s.courseTitle}</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">
                        {s.courseCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="truncate max-w-[180px] block font-medium">
                        {s.currentLesson}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {s.completedLessonsCount} lessons finished
                      </span>
                    </td>

                    <td className="py-3.5 px-4 w-44">
                      <div className="space-y-1">
                        <ProgressBar percentage={s.progressPercentage} size="sm" />
                        <span className="text-[10px] text-slate-500 font-semibold block text-right">
                          {s.progressPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.lastActive).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
