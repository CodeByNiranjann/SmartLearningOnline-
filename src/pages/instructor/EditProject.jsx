import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchProjectById,
  createProject,
  updateProject,
  fetchCourses,
  fetchProjectMilestones,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
} from '../../services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Clock,
  Code2,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderGit2,
  ListChecks,
  Calendar,
  Award,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'Full-Stack Development',
  'Frontend Engineering',
  'Backend & Microservices',
  'DevOps & Cloud Infrastructure',
  'Data Science & Analytics',
  'AI & Machine Learning',
  'Mobile App Development',
];

const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!projectId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('Full-Stack Development');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [estimatedHours, setEstimatedHours] = useState(15);
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('published');

  // Dynamic Array Fields
  const [technologies, setTechnologies] = useState(['React', 'Node.js', 'Express', 'MongoDB']);
  const [newTech, setNewTech] = useState('');

  const [requiredSkills, setRequiredSkills] = useState(['REST APIs', 'State Management']);
  const [newSkill, setNewSkill] = useState('');

  const [learningObjectives, setLearningObjectives] = useState(['Build production-ready architecture', 'Implement secure role-based access']);
  const [newObjective, setNewObjective] = useState('');

  const [deliverables, setDeliverables] = useState(['Git repository URL', 'Live deployed web application']);
  const [newDeliverable, setNewDeliverable] = useState('');

  const [prerequisites, setPrerequisites] = useState(['Basic JavaScript proficiency']);
  const [newPrereq, setNewPrereq] = useState('');

  // Milestone Management
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneOrder, setMilestoneOrder] = useState(1);
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [milestoneDeliverables, setMilestoneDeliverables] = useState([]);
  const [newMilestoneDeliv, setNewMilestoneDeliv] = useState('');

  // Evaluation Rubric Management (SLP-7)
  const [rubric, setRubric] = useState([
    { criteria: 'Core Functionality & Requirements', maxPoints: 40, description: 'Meets all functional specifications and handles core user flows cleanly.' },
    { criteria: 'Code Quality & Architecture', maxPoints: 30, description: 'Well-structured components, clean architecture, and best practices.' },
    { criteria: 'UI/UX & Responsiveness', maxPoints: 20, description: 'Polished aesthetic, accessible layout, and smooth mobile experience.' },
    { criteria: 'Documentation & Setup Guide', maxPoints: 10, description: 'Clear README with setup instructions and architectural notes.' },
  ]);
  const [newCriteria, setNewCriteria] = useState('');
  const [newMaxPoints, setNewMaxPoints] = useState(25);
  const [newCriteriaDesc, setNewCriteriaDesc] = useState('');

  // Load instructor's courses
  useEffect(() => {
    const loadData = async () => {
      try {
        const courseData = await fetchCourses();
        setCourses(Array.isArray(courseData) ? courseData : courseData.courses || []);

        if (isEditing) {
          const data = await fetchProjectById(projectId);
          const p = data.project;
          if (p) {
            setTitle(p.title || '');
            setDescription(p.description || '');
            setFullDescription(p.fullDescription || '');
            setCategory(p.category || 'Full-Stack Development');
            setDifficulty(p.difficulty || 'Intermediate');
            setEstimatedHours(p.estimatedHours || 15);
            setThumbnail(p.thumbnail || '');
            setCourseId(p.courseId?._id || p.courseId || '');
            setStatus(p.status || 'published');
            setTechnologies(p.technologies || []);
            setRequiredSkills(p.requiredSkills || []);
            setLearningObjectives(p.learningObjectives || []);
            setDeliverables(p.deliverables || []);
            setPrerequisites(p.prerequisites || []);
            if (Array.isArray(p.rubric) && p.rubric.length > 0) {
              setRubric(p.rubric);
            }
          }

          // Load milestones
          const mData = await fetchProjectMilestones(projectId);
          setMilestones(mData.milestones || []);
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
        setError('Failed to load project details.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [projectId, isEditing]);

  // Array Handlers
  const addTech = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech('');
    }
  };

  const removeTech = (item) => {
    setTechnologies(technologies.filter((t) => t !== item));
  };

  const addSkill = () => {
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (item) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== item));
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setLearningObjectives([...learningObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const removeObjective = (index) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const removeDeliverable = (index) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const addPrereq = () => {
    if (newPrereq.trim()) {
      setPrerequisites([...prerequisites, newPrereq.trim()]);
      setNewPrereq('');
    }
  };

  const removePrereq = (index) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  // Milestone Handlers
  const openMilestoneModal = (milestone = null) => {
    if (milestone) {
      setEditingMilestoneId(milestone._id);
      setMilestoneTitle(milestone.title);
      setMilestoneDesc(milestone.description || '');
      setMilestoneOrder(milestone.sequenceOrder || milestones.length + 1);
      setMilestoneDueDate(milestone.dueDate ? milestone.dueDate.split('T')[0] : '');
      setMilestoneDeliverables(milestone.requiredDeliverables || []);
    } else {
      setEditingMilestoneId(null);
      setMilestoneTitle('');
      setMilestoneDesc('');
      setMilestoneOrder(milestones.length + 1);
      setMilestoneDueDate('');
      setMilestoneDeliverables([]);
    }
    setShowMilestoneModal(true);
  };

  const saveMilestone = async () => {
    if (!milestoneTitle.trim()) return;

    const payload = {
      title: milestoneTitle.trim(),
      description: milestoneDesc.trim(),
      sequenceOrder: Number(milestoneOrder),
      dueDate: milestoneDueDate ? new Date(milestoneDueDate) : null,
      requiredDeliverables: milestoneDeliverables,
    };

    if (isEditing) {
      try {
        if (editingMilestoneId) {
          const res = await updateProjectMilestone(projectId, editingMilestoneId, payload);
          setMilestones(milestones.map((m) => (m._id === editingMilestoneId ? res.milestone : m)));
        } else {
          const res = await createProjectMilestone(projectId, payload);
          setMilestones([...milestones, res.milestone]);
        }
        setShowMilestoneModal(false);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to save milestone.');
      }
    } else {
      // In creation mode, maintain in local state
      if (editingMilestoneId !== null) {
        setMilestones(milestones.map((m, i) => (i === editingMilestoneId ? { ...payload } : m)));
      } else {
        setMilestones([...milestones, payload]);
      }
      setShowMilestoneModal(false);
    }
  };

  const handleDeleteMilestone = async (milestone, index) => {
    if (!window.confirm('Delete this milestone?')) return;
    if (isEditing && milestone._id) {
      try {
        await deleteProjectMilestone(projectId, milestone._id);
        setMilestones(milestones.filter((m) => m._id !== milestone._id));
      } catch (err) {
        alert('Failed to delete milestone.');
      }
    } else {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  // Main Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a project title and description.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        fullDescription: fullDescription.trim() || description.trim(),
        category,
        difficulty,
        estimatedHours: Number(estimatedHours) || 12,
        thumbnail: thumbnail.trim(),
        courseId: courseId || null,
        status,
        technologies,
        requiredSkills,
        learningObjectives,
        deliverables,
        prerequisites,
        rubric,
      };

      if (isEditing) {
        await updateProject(projectId, payload);
        setSuccessMsg('Project updated successfully!');
      } else {
        payload.milestones = milestones;
        const res = await createProject(payload);
        navigate(`/manage/projects/${res.project._id}/edit`);
      }
    } catch (err) {
      console.error('Project save failed:', err);
      setError(err.response?.data?.message || 'Failed to save project. Please check requirements.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs font-semibold">Loading project configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex items-center justify-between">
        <Link
          to="/manage/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects List
        </Link>

        {isEditing && (
          <Link
            to={`/projects/${projectId}`}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View Public Project Page
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Real-World Project' : 'Create New Real-World Project'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure practical capstone architecture, ordered milestones, technology stack, and rubrics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Save Changes' : 'Publish Project'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── 1. Core Metadata Card ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
            1. Basic Project Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed E-Commerce Microservices Platform"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category / Domain</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration (Hours)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Associated Course (Optional)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Course (Standalone Capstone)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Thumbnail Image URL</label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Summary Description *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief 2-3 sentence overview shown on project cards..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Project Specifications & Requirements</label>
            <textarea
              rows={5}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed architectural specifications, system diagrams, and guidelines..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* ─── 2. Technology Stack & Skills ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Code2 className="w-4 h-4 text-emerald-600" />
            2. Technology Stack & Required Skills
          </h3>

          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technology Stack</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {technologies.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTech();
                  }
                }}
                placeholder="Add technology (e.g. Next.js, Redis, Docker)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={addTech}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Add Tech
              </button>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {requiredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => removeSkill(sk)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add required skill (e.g. Dockerization, Auth Tokens)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. Objectives, Deliverables & Prerequisites ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <ListChecks className="w-4 h-4 text-indigo-600" />
            3. Outcomes, Deliverables & Prerequisites
          </h3>

          {/* Learning Objectives */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Learning Outcomes / Objectives</label>
            <div className="space-y-1.5 mb-2">
              {learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                  <span>{obj}</span>
                  <button type="button" onClick={() => removeObjective(i)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add learning outcome..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={addObjective}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Add Objective
              </button>
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expected Deliverables</label>
            <div className="space-y-1.5 mb-2">
              {deliverables.map((deliv, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                  <span>{deliv}</span>
                  <button type="button" onClick={() => removeDeliverable(i)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add deliverable..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={addDeliverable}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Add Deliverable
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4. Ordered Milestones Manager ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                4. Project Milestones & Step-by-Step Sequence
              </h3>
              <p className="text-[11px] text-slate-400">
                Define the ordered steps students will follow to build and submit this project.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openMilestoneModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Milestone
            </button>
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-xs text-slate-500">No milestones configured yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {milestones.map((m, idx) => (
                <div
                  key={m._id || idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {m.sequenceOrder || idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openMilestoneModal(m)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMilestone(m, idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 5. Evaluation Rubric & Scoring Criteria (SLP-7) ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              5. Practical Evaluation Rubric & Scoring Criteria
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Total Points: {rubric.reduce((acc, r) => acc + (Number(r.maxPoints) || 0), 0)} pts
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Define grading criteria so students understand the evaluation standards for their practical project deliverables.
          </p>

          <div className="space-y-2.5">
            {rubric.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-3"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.criteria}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {item.maxPoints} pts
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setRubric(rubric.filter((_, i) => i !== idx))}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  title="Remove criteria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Criteria Form */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">Add Evaluation Criteria</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Criteria Title (e.g. Test Coverage)"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                className="sm:col-span-3 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Max Points"
                value={newMaxPoints}
                onChange={(e) => setNewMaxPoints(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Description of criteria expectations..."
                value={newCriteriaDesc}
                onChange={(e) => setNewCriteriaDesc(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (newCriteria.trim()) {
                    setRubric([
                      ...rubric,
                      {
                        criteria: newCriteria.trim(),
                        maxPoints: Number(newMaxPoints) || 20,
                        description: newCriteriaDesc.trim(),
                      },
                    ]);
                    setNewCriteria('');
                    setNewMaxPoints(20);
                    setNewCriteriaDesc('');
                  }
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Add Criteria
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/manage/projects"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </form>

      {/* ─── Milestone Modal ─── */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMilestoneId ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Database Schema & Architecture"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sequence Order</label>
                <input
                  type="number"
                  min="1"
                  value={milestoneOrder}
                  onChange={(e) => setMilestoneOrder(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Instructions for students on what to implement in this milestone..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMilestone}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProject;
