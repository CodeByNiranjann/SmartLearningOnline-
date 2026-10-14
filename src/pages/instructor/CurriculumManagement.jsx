import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllModules, fetchAllLessons, deleteModule, deleteLesson } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  BookOpen,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
} from 'lucide-react';

const CurriculumManagement = ({ initialTab = 'modules' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState(initialTab); // 'modules' | 'lessons'
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'module'|'lesson', item: object }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [modData, lesData] = await Promise.all([
        fetchAllModules(),
        fetchAllLessons(),
      ]);
      setModules(modData);
      setLessons(lesData);
    } catch (err) {
      console.error('Failed to load curriculum:', err);
      setError('Failed to fetch modules and lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setError('');
      setSuccess('');
      if (deleteTarget.type === 'module') {
        await deleteModule(deleteTarget.item._id);
        setSuccess('Module and all associated lessons deleted successfully.');
      } else {
        await deleteLesson(deleteTarget.item._id);
        setSuccess('Lesson deleted successfully.');
      }
      setDeleteTarget(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredModules = modules.filter((m) => {
    const courseTitle = m.courseId?.title || '';
    return (
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      courseTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredLessons = lessons.filter((l) => {
    const courseTitle = l.courseId?.title || '';
    const moduleTitle = l.moduleId?.title || '';
    return (
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      moduleTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Curriculum Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Oversee modules and lessons across all platform courses.'
              : 'Browse and manage curriculum modules and lessons for your courses.'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Tabs & Search Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Modules ({modules.length})
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lessons ({lessons.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* ─── Content Table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading curriculum items...</p>
          </div>
        ) : activeTab === 'modules' ? (
          filteredModules.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No modules found</p>
              <p className="text-xs text-slate-400">Create a course to begin structuring modules.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Module Title</th>
                    <th className="py-3.5 px-4">Parent Course</th>
                    <th className="py-3.5 px-4">Lessons</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredModules.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-500">
                        #{m.order}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{m.title}</p>
                        {m.description && (
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">{m.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{m.courseId?.title || 'Unknown Course'}</span>
                        <span className="block text-[10px] text-slate-400">By {m.courseId?.instructor}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {m.lessonCount} Lessons
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/manage/courses/${m.courseId?._id}/modules/${m._id}/lessons`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Manage Lessons in Module"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget({ type: 'module', item: m })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredLessons.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No lessons found</p>
              <p className="text-xs text-slate-400">Add lessons to modules to populate this catalog.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Lesson Title</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLessons.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-500">
                        #{l.order}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{l.title}</p>
                        {l.description && (
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">{l.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {l.moduleId?.title || 'Module'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{l.courseId?.title || 'Course'}</span>
                        <span className="block text-[10px] text-slate-400">By {l.courseId?.instructor}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/learning/${l.courseId?._id}/${l._id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Preview Student Lesson"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget({ type: 'lesson', item: l })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="p-3 bg-rose-50 rounded-xl w-fit text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Delete {deleteTarget.type === 'module' ? 'Module' : 'Lesson'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">{deleteTarget.item.title}</strong>?{' '}
                {deleteTarget.type === 'module' &&
                  'This will permanently delete all lessons and learning resources within this module.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;
