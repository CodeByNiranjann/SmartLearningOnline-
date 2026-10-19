import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchActivityById,
  createActivity,
  updateActivity,
  fetchCourses,
  createActivityMilestone,
  updateActivityMilestone,
  deleteActivityMilestone,
} from '../../services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Layers,
  Clock,
  Code2,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Award,
  Calendar,
  X,
  Eye,
  Check,
  ListChecks,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'Full-Stack Development',
  'Frontend Engineering',
  'Backend & Microservices',
  'DevOps & Cloud Infrastructure',
  'Data Science & Analytics',
  'AI & Machine Learning',
  'Mobile App Development',
  'General',
];

const EditActivity = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(activityId);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('Full-Stack Development');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [activityType, setActivityType] = useState('individual');
  const [estimatedDuration, setEstimatedDuration] = useState('4 hours');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maximumMarks, setMaximumMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(50);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [status, setStatus] = useState('draft');

  // Tag arrays
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [techStack, setTechStack] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [objectives, setObjectives] = useState([]);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [deliverables, setDeliverables] = useState([]);
  const [deliverableInput, setDeliverableInput] = useState('');

  // Rubric
  const [rubric, setRubric] = useState([
    { criteria: 'Core Implementation & Functionality', maxMarks: 40, description: 'All core features working smoothly as required' },
    { criteria: 'Code Quality & Architecture', maxMarks: 30, description: 'Clean, structured, and readable code' },
    { criteria: 'Testing & Error Handling', maxMarks: 20, description: 'Edge cases covered and proper error handling' },
    { criteria: 'Documentation & Presentation', maxMarks: 10, description: 'Clear README or project report' },
  ]);

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [milestoneReqs, setMilestoneReqs] = useState('');

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load available courses and activity data
  useEffect(() => {
    const init = async () => {
      try {
        setInitialLoading(true);
        const coursesData = await fetchCourses();
        setCourses(coursesData || []);

        if (isEditing) {
          const res = await fetchActivityById(activityId);
          const act = res.activity;
          setTitle(act.title || '');
          setDescription(act.description || '');
          setProblemStatement(act.problemStatement || '');
          setInstructions(act.instructions || '');
          setCategory(act.category || 'Full-Stack Development');
          setDifficulty(act.difficulty || 'Intermediate');
          setActivityType(act.activityType || 'individual');
          setEstimatedDuration(act.estimatedDuration || '4 hours');
          setSelectedCourseId(act.course?._id || act.course || '');
          setSelectedModuleId(act.module?._id || act.module || '');
          setSelectedLessonId(act.lesson?._id || act.lesson || '');
          setSkills(act.requiredSkills || []);
          setTechStack(act.technologyStack || []);
          setObjectives(act.learningObjectives || []);
          setDeliverables(act.deliverables || []);
          setMaximumMarks(act.maximumMarks || 100);
          setPassingMarks(act.passingMarks || 50);
          setAllowResubmission(act.allowResubmission ?? true);
          setStatus(act.status || 'draft');

          if (act.startDate) {
            setStartDate(new Date(act.startDate).toISOString().slice(0, 10));
          }
          if (act.dueDate) {
            setDueDate(new Date(act.dueDate).toISOString().slice(0, 10));
          }
          if (act.gradingRubric?.length) {
            setRubric(act.gradingRubric);
          }

          setMilestones(res.milestones || []);
        } else if (coursesData?.length) {
          setSelectedCourseId(coursesData[0]._id);
        }
      } catch (err) {
        console.error('Error loading activity data:', err);
        setError('Failed to load activity details');
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, [activityId, isEditing]);

  // Helper tag handlers
  const handleAddTag = (val, setter, currentList, inputSetter) => {
    const trimmed = val.trim();
    if (trimmed && !currentList.includes(trimmed)) {
      setter([...currentList, trimmed]);
      inputSetter('');
    }
  };

  const handleRemoveTag = (index, setter, currentList) => {
    setter(currentList.filter((_, i) => i !== index));
  };

  // Rubric handlers
  const handleAddRubricItem = () => {
    setRubric([...rubric, { criteria: 'New Criteria', maxMarks: 10, description: '' }]);
  };

  const handleUpdateRubric = (index, field, value) => {
    const updated = [...rubric];
    updated[index][field] = field === 'maxMarks' ? Number(value) : value;
    setRubric(updated);
  };

  const handleRemoveRubric = (index) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  // Milestone manager handlers
  const handleSaveMilestone = async () => {
    if (!milestoneTitle.trim()) return;

    if (isEditing) {
      try {
        if (editingMilestone) {
          const res = await updateActivityMilestone(activityId, editingMilestone._id, {
            title: milestoneTitle,
            description: milestoneDesc,
            dueDate: milestoneDueDate || null,
            completionRequirements: milestoneReqs,
          });
          setMilestones(
            milestones.map((m) => (m._id === editingMilestone._id ? res.milestone : m))
          );
        } else {
          const res = await createActivityMilestone(activityId, {
            title: milestoneTitle,
            description: milestoneDesc,
            dueDate: milestoneDueDate || null,
            completionRequirements: milestoneReqs,
            sequenceOrder: milestones.length + 1,
          });
          setMilestones([...milestones, res.milestone]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save milestone');
        return;
      }
    } else {
      // In-memory creation mode
      if (editingMilestone) {
        setMilestones(
          milestones.map((m, idx) =>
            idx === editingMilestone.index
              ? {
                  ...m,
                  title: milestoneTitle,
                  description: milestoneDesc,
                  dueDate: milestoneDueDate,
                  completionRequirements: milestoneReqs,
                }
              : m
          )
        );
      } else {
        setMilestones([
          ...milestones,
          {
            title: milestoneTitle,
            description: milestoneDesc,
            sequenceOrder: milestones.length + 1,
            dueDate: milestoneDueDate,
            completionRequirements: milestoneReqs,
          },
        ]);
      }
    }

    setEditingMilestone(null);
    setMilestoneTitle('');
    setMilestoneDesc('');
    setMilestoneDueDate('');
    setMilestoneReqs('');
  };

  const handleDeleteMilestone = async (index, milestoneId) => {
    if (isEditing && milestoneId) {
      try {
        await deleteActivityMilestone(activityId, milestoneId);
      } catch (err) {
        setError('Failed to delete milestone');
        return;
      }
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Save / Publish
  const handleSubmit = async (targetStatus) => {
    try {
      setLoading(true);
      setError('');

      if (!title.trim()) {
        setError('Please enter an activity title');
        setLoading(false);
        return;
      }
      if (!description.trim()) {
        setError('Please enter a short description');
        setLoading(false);
        return;
      }
      if (!selectedCourseId) {
        setError('Please select an associated course');
        setLoading(false);
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        problemStatement: problemStatement.trim(),
        instructions,
        category,
        difficulty,
        activityType,
        estimatedDuration,
        courseId: selectedCourseId,
        module: selectedModuleId || null,
        lesson: selectedLessonId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        maximumMarks: Number(maximumMarks),
        passingMarks: Number(passingMarks),
        allowResubmission,
        requiredSkills: skills,
        technologyStack: techStack,
        learningObjectives: objectives,
        deliverables,
        gradingRubric: rubric,
        status: targetStatus || status,
        milestones: !isEditing ? milestones : undefined,
      };

      if (isEditing) {
        await updateActivity(activityId, payload);
        setSuccessMsg('Activity updated successfully!');
      } else {
        const res = await createActivity(selectedCourseId, payload);
        setSuccessMsg('Activity created successfully!');
        setTimeout(() => navigate(`/manage/activities`), 1200);
        return;
      }

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm">Loading activity configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/manage/activities"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Project Activity' : 'Create New Project Activity'}
            </h1>
            <p className="text-xs text-slate-500">
              Configure activity instructions, milestone steps, required deliverables, and evaluation criteria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : 'Publish Activity'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Basic Information</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activity Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Build a Full-Stack RESTful API with Authentication & Role-Based Access"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Summary Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary displayed on activity cards and dashboard listings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Problem Statement
            </label>
            <textarea
              rows={3}
              placeholder="Describe the real-world challenge or scenario students will solve..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Instructions
            </label>
            <textarea
              rows={5}
              placeholder="Provide comprehensive instructions, implementation hints, and setup guides..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="individual">Individual Activity</option>
                <option value="group">Group / Team Activity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimated Duration</label>
              <input
                type="text"
                placeholder="e.g., 6 hours"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Course & Curriculum Linking */}
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pt-4 pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Course Association</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Associated Course <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Optional Module ID
            </label>
            <input
              type="text"
              placeholder="e.g. MongoDB Module ID"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Optional Lesson ID
            </label>
            <input
              type="text"
              placeholder="e.g. Capstone Lesson ID"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Dates, Deliverables & Marks */}
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pt-4 pb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          <span>Timeline, Grading & Deliverables</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Maximum Marks</label>
            <input
              type="number"
              min={1}
              value={maximumMarks}
              onChange={(e) => setMaximumMarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Passing Marks</label>
            <input
              type="number"
              min={0}
              max={maximumMarks}
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="allowResubmission"
            checked={allowResubmission}
            onChange={(e) => setAllowResubmission(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="allowResubmission" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Allow student resubmissions when revisions are requested
          </label>
        </div>

        {/* Deliverables Required */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-700">
            Expected Deliverables (e.g., GitHub Repository, Live URL, PDF Architecture Document)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add expected deliverable item..."
              value={deliverableInput}
              onChange={(e) => setDeliverableInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), handleAddTag(deliverableInput, setDeliverables, deliverables, setDeliverableInput))
              }
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => handleAddTag(deliverableInput, setDeliverables, deliverables, setDeliverableInput)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {deliverables.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                <span>{d}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(i, setDeliverables, deliverables)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills & Tech Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Tech Stack */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Technology Stack</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., React, Express, MongoDB..."
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), handleAddTag(techInput, setTechStack, techStack, setTechInput))
                }
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleAddTag(techInput, setTechStack, techStack, setTechInput)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  <span>{t}</span>
                  <button type="button" onClick={() => handleRemoveTag(i, setTechStack, techStack)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Required Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., API Design, JWT, Async/Await..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), handleAddTag(skillInput, setSkills, skills, setSkillInput))
                }
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleAddTag(skillInput, setSkills, skills, setSkillInput)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  <span>{s}</span>
                  <button type="button" onClick={() => handleRemoveTag(i, setSkills, skills)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Grading Rubric Builder */}
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>Grading Rubric</span>
          </div>
          <button
            type="button"
            onClick={handleAddRubricItem}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rubric Criteria</span>
          </button>
        </h2>

        <div className="space-y-3">
          {rubric.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row gap-3 items-start md:items-center"
            >
              <div className="flex-1 space-y-1 w-full">
                <input
                  type="text"
                  placeholder="Criteria name"
                  value={item.criteria}
                  onChange={(e) => handleUpdateRubric(idx, 'criteria', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
                <input
                  type="text"
                  placeholder="Description of expected standard..."
                  value={item.description}
                  onChange={(e) => handleUpdateRubric(idx, 'description', e.target.value)}
                  className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Max:</span>
                  <input
                    type="number"
                    min={1}
                    value={item.maxMarks}
                    onChange={(e) => handleUpdateRubric(idx, 'maxMarks', e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold text-slate-800"
                  />
                  <span className="text-xs text-slate-500">pts</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRubric(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Milestone Steps Manager */}
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Ordered Milestones & Tasks</span>
          </div>
        </h2>

        {/* Add / Edit Milestone Inline Form */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-3">
          <p className="text-xs font-bold text-blue-900">
            {editingMilestone ? 'Edit Milestone' : 'Add New Milestone Step'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                placeholder="e.g. Milestone 1: Database Schema & Entity Modeling"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={milestoneDueDate}
                onChange={(e) => setMilestoneDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Description & Completion Requirements
            </label>
            <textarea
              rows={2}
              placeholder="What tasks must be completed in this milestone?"
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingMilestone && (
              <button
                type="button"
                onClick={() => {
                  setEditingMilestone(null);
                  setMilestoneTitle('');
                  setMilestoneDesc('');
                  setMilestoneDueDate('');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveMilestone}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              {editingMilestone ? 'Save Milestone' : 'Add Milestone'}
            </button>
          </div>
        </div>

        {/* Existing Milestones List */}
        <div className="space-y-2.5">
          {milestones.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No milestones defined yet.</p>
          ) : (
            milestones.map((m, idx) => (
              <div
                key={m._id || idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {m.sequenceOrder || idx + 1}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{m.title}</p>
                    {m.description && <p className="text-[11px] text-slate-500">{m.description}</p>}
                    {m.dueDate && (
                      <p className="text-[10px] text-blue-600 font-semibold">
                        Due: {new Date(m.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMilestone({ ...m, index: idx });
                      setMilestoneTitle(m.title);
                      setMilestoneDesc(m.description || '');
                      setMilestoneDueDate(
                        m.dueDate ? new Date(m.dueDate).toISOString().slice(0, 10) : ''
                      );
                    }}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(idx, m._id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Student Activity Preview
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {difficulty} · {category}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">{title || 'Activity Title'}</h2>
              <p className="text-xs text-slate-600">{description || 'Short summary...'}</p>

              {problemStatement && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Problem Statement</h4>
                  <p className="text-xs text-slate-600">{problemStatement}</p>
                </div>
              )}

              {milestones.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800">Milestones ({milestones.length})</h4>
                  {milestones.map((m, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <p className="font-bold text-slate-800">
                        {i + 1}. {m.title}
                      </p>
                      {m.description && <p className="text-slate-500">{m.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditActivity;
