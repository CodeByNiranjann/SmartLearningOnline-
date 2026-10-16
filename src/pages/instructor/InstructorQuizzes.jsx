import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchQuizzes,
  fetchQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  fetchCourses,
} from '../../services/api';
import {
  HelpCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  FileQuestion,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  Save,
  BookOpen,
  Filter,
  CheckSquare,
  ListChecks,
  ToggleLeft,
  PenTool,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';

const QUESTION_TYPES = [
  {
    type: 'single_choice',
    label: 'MCQ (Single Answer)',
    description: 'Learners select one correct choice from multiple options',
    icon: CheckCircle2,
  },
  {
    type: 'multiple_choice',
    label: 'MCQ (Multiple Answers)',
    description: 'Learners check all choices that apply to the question',
    icon: ListChecks,
  },
  {
    type: 'true_false',
    label: 'True / False',
    description: 'Binary choice to test conceptual accuracy',
    icon: ToggleLeft,
  },
  {
    type: 'short_answer',
    label: 'Short Answer',
    description: 'Open text response matched against accepted answers',
    icon: PenTool,
  },
];

const createEmptyQuestion = (index = 0) => ({
  _tempId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  questionText: '',
  type: 'single_choice',
  options: ['', ''],
  correctOptionIndex: 0,
  correctOptions: [0],
  correctBoolean: true,
  acceptedAnswers: [''],
  explanation: '',
  points: 1,
  order: index,
});

const DEFAULT_FORM = {
  title: '',
  description: '',
  courseId: '',
  timeLimit: 15,
  maxAttempts: 0,
  status: 'published',
  passingScore: 50,
  questions: [createEmptyQuestion(0)],
};

const InstructorQuizzes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load instructor courses and quizzes
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const courseParams = isAdmin ? {} : { instructor_id: user?._id };
      const [coursesData, quizzesData] = await Promise.all([
        fetchCourses(courseParams),
        fetchQuizzes(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setQuizzes(quizzesData?.quizzes || []);
    } catch (err) {
      console.error('Error loading quizzes or courses:', err);
      setError(err.response?.data?.message || 'Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?._id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filtered quizzes list
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch =
        !search.trim() ||
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.courseId?.title?.toLowerCase().includes(search.toLowerCase());

      const matchesCourse =
        courseFilter === 'all' ||
        (quiz.courseId?._id || quiz.courseId) === courseFilter;

      const matchesStatus =
        statusFilter === 'all' || quiz.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [quizzes, search, courseFilter, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = quizzes.length;
    const published = quizzes.filter((q) => q.status === 'published').length;
    const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);
    return { total, published, totalQuestions };
  }, [quizzes]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingQuizId(null);
    setFormErrors([]);
    setFormData({
      ...DEFAULT_FORM,
      courseId: courses[0]?._id || '',
      questions: [createEmptyQuestion(0)],
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = async (quiz) => {
    try {
      setIsSubmitting(true);
      setEditingQuizId(quiz._id);
      setFormErrors([]);

      // Fetch fresh single quiz to guarantee full questions with answers
      const res = await fetchQuizById(quiz._id);
      const target = res.quiz || quiz;

      const preparedQuestions = (target.questions || []).map((q, idx) => ({
        _tempId: q._id || `q_${Date.now()}_${idx}`,
        questionText: q.questionText || '',
        type: q.type || 'single_choice',
        options: Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : ['', ''],
        correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
        correctOptions: Array.isArray(q.correctOptions) && q.correctOptions.length > 0
          ? [...q.correctOptions]
          : [q.correctOptionIndex || 0],
        correctBoolean: typeof q.correctBoolean === 'boolean' ? q.correctBoolean : true,
        acceptedAnswers: Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0
          ? [...q.acceptedAnswers]
          : [''],
        explanation: q.explanation || '',
        points: q.points || 1,
        order: typeof q.order === 'number' ? q.order : idx,
      }));

      setFormData({
        title: target.title || '',
        description: target.description || '',
        courseId: target.courseId?._id || target.courseId || '',
        timeLimit: typeof target.timeLimit === 'number' ? target.timeLimit : 0,
        maxAttempts: typeof target.maxAttempts === 'number' ? target.maxAttempts : 0,
        status: target.status || 'published',
        passingScore: typeof target.passingScore === 'number' ? target.passingScore : 50,
        questions: preparedQuestions.length > 0 ? preparedQuestions : [createEmptyQuestion(0)],
      });

      setIsFormOpen(true);
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      setError('Could not load quiz details for editing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close Form Modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingQuizId(null);
    setFormErrors([]);
  };

  // Question manipulation helpers
  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion(prev.questions.length)],
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (formData.questions.length <= 1) {
      setFormErrors(['Quiz must contain at least one question.']);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.questions.length) return;

    setFormData((prev) => {
      const updated = [...prev.questions];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, questions: updated };
    });
  };

  const handleQuestionFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };

      // Initialize default type structures if question type changed
      if (field === 'type') {
        if (value === 'single_choice') {
          if (!updated[index].options || updated[index].options.length < 2) {
            updated[index].options = ['', ''];
          }
          updated[index].correctOptionIndex = 0;
          updated[index].correctOptions = [0];
        } else if (value === 'multiple_choice') {
          if (!updated[index].options || updated[index].options.length < 2) {
            updated[index].options = ['', ''];
          }
          updated[index].correctOptions = [0];
        } else if (value === 'true_false') {
          updated[index].options = ['True', 'False'];
          updated[index].correctBoolean = true;
          updated[index].correctOptionIndex = 0;
        } else if (value === 'short_answer') {
          if (!updated[index].acceptedAnswers || updated[index].acceptedAnswers.length === 0) {
            updated[index].acceptedAnswers = [''];
          }
        }
      }

      return { ...prev, questions: updated };
    });
  };

  // Option manipulation for MCQ
  const handleOptionChange = (qIndex, optIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const options = [...updated[qIndex].options];
      options[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options };
      return { ...prev, questions: updated };
    });
  };

  const handleAddOption = (qIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const options = [...updated[qIndex].options, ''];
      updated[qIndex] = { ...updated[qIndex], options };
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const q = updated[qIndex];
      if (q.options.length <= 2) return prev; // Keep minimum 2 options

      const options = q.options.filter((_, idx) => idx !== optIndex);
      let correctOptionIndex = q.correctOptionIndex;
      let correctOptions = q.correctOptions || [];

      // Adjust single choice index if removed
      if (correctOptionIndex >= options.length) {
        correctOptionIndex = options.length - 1;
      }

      // Adjust multiple choice indices
      correctOptions = correctOptions
        .filter((idx) => idx !== optIndex)
        .map((idx) => (idx > optIndex ? idx - 1 : idx));

      if (correctOptions.length === 0) {
        correctOptions = [0];
      }

      updated[qIndex] = {
        ...q,
        options,
        correctOptionIndex,
        correctOptions,
      };

      return { ...prev, questions: updated };
    });
  };

  const handleToggleMultipleChoiceOption = (qIndex, optIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const q = updated[qIndex];
      const existing = q.correctOptions || [];
      let newSelection;

      if (existing.includes(optIndex)) {
        newSelection = existing.filter((idx) => idx !== optIndex);
      } else {
        newSelection = [...existing, optIndex].sort((a, b) => a - b);
      }

      updated[qIndex] = { ...q, correctOptions: newSelection };
      return { ...prev, questions: updated };
    });
  };

  // Accepted answer helper for short answer questions
  const handleAcceptedAnswerChange = (qIndex, ansIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const answers = [...updated[qIndex].acceptedAnswers];
      answers[ansIndex] = value;
      updated[qIndex] = { ...updated[qIndex], acceptedAnswers: answers };
      return { ...prev, questions: updated };
    });
  };

  const handleAddAcceptedAnswer = (qIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const answers = [...updated[qIndex].acceptedAnswers, ''];
      updated[qIndex] = { ...updated[qIndex], acceptedAnswers: answers };
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveAcceptedAnswer = (qIndex, ansIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      if (updated[qIndex].acceptedAnswers.length <= 1) return prev;
      const answers = updated[qIndex].acceptedAnswers.filter((_, idx) => idx !== ansIndex);
      updated[qIndex] = { ...updated[qIndex], acceptedAnswers: answers };
      return { ...prev, questions: updated };
    });
  };

  // Validation function enforcing Requirement 6
  const validateFrontendForm = () => {
    const errors = [];

    if (!formData.title || !formData.title.trim()) {
      errors.push('Quiz title is required.');
    }

    if (!formData.courseId) {
      errors.push('Course selection is required.');
    }

    if (!Array.isArray(formData.questions) || formData.questions.length === 0) {
      errors.push('At least one question is required.');
    } else {
      formData.questions.forEach((q, idx) => {
        const num = idx + 1;
        if (!q.questionText || !q.questionText.trim()) {
          errors.push(`Question #${num}: Question text is required.`);
        }

        const type = q.type || 'single_choice';

        if (type === 'single_choice') {
          const filledOptions = (q.options || []).filter((opt) => opt && opt.trim());
          if (filledOptions.length < 2) {
            errors.push(`Question #${num} (MCQ Single): Must have at least 2 non-empty options.`);
          }
          if (
            typeof q.correctOptionIndex !== 'number' ||
            q.correctOptionIndex < 0 ||
            q.correctOptionIndex >= (q.options || []).length
          ) {
            errors.push(`Question #${num} (MCQ Single): Must have 1 correct answer selected.`);
          }
        } else if (type === 'multiple_choice') {
          const filledOptions = (q.options || []).filter((opt) => opt && opt.trim());
          if (filledOptions.length < 2) {
            errors.push(`Question #${num} (MCQ Multiple): Must have at least 2 non-empty options.`);
          }
          if (!Array.isArray(q.correctOptions) || q.correctOptions.length === 0) {
            errors.push(`Question #${num} (MCQ Multiple): Must have at least 1 correct answer selected.`);
          }
        } else if (type === 'true_false') {
          if (typeof q.correctBoolean !== 'boolean') {
            errors.push(`Question #${num} (True/False): Must select a correct value (True or False).`);
          }
        } else if (type === 'short_answer') {
          const filledAnswers = (q.acceptedAnswers || []).filter((ans) => ans && ans.trim());
          if (filledAnswers.length === 0) {
            errors.push(`Question #${num} (Short Answer): Must provide at least one accepted answer.`);
          }
        }
      });
    }

    return errors;
  };

  // Submit Handler (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const validationErrors = validateFrontendForm();
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId,
        timeLimit: Number(formData.timeLimit) >= 0 ? Number(formData.timeLimit) : 0,
        maxAttempts: Number(formData.maxAttempts) >= 0 ? Number(formData.maxAttempts) : 0,
        status: formData.status,
        passingScore: Number(formData.passingScore) || 50,
        questions: formData.questions.map((q, idx) => ({
          questionText: q.questionText.trim(),
          type: q.type,
          options: q.type === 'short_answer'
            ? []
            : q.type === 'true_false'
            ? ['True', 'False']
            : (q.options || []).map((o) => o.trim()),
          correctOptionIndex: q.type === 'single_choice'
            ? Number(q.correctOptionIndex)
            : q.type === 'true_false'
            ? (q.correctBoolean ? 0 : 1)
            : (q.correctOptions?.[0] ?? 0),
          correctOptions: q.type === 'multiple_choice'
            ? q.correctOptions
            : [q.correctOptionIndex ?? 0],
          correctBoolean: q.type === 'true_false' ? Boolean(q.correctBoolean) : undefined,
          acceptedAnswers: q.type === 'short_answer'
            ? (q.acceptedAnswers || []).map((a) => a.trim()).filter(Boolean)
            : [],
          explanation: q.explanation ? q.explanation.trim() : '',
          points: Number(q.points) || 1,
          order: idx,
        })),
      };

      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload);
        setSuccessMsg(`Quiz "${payload.title}" updated successfully!`);
      } else {
        await createQuiz(payload);
        setSuccessMsg(`Quiz "${payload.title}" created successfully!`);
      }

      handleCloseForm();
      await loadInitialData();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      console.error('Quiz submit error:', err);
      const serverMsg = err.response?.data?.message || 'Failed to save quiz.';
      setFormErrors([serverMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteQuiz = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteQuiz(deleteTarget._id);
      setSuccessMsg(`Quiz "${deleteTarget.title}" has been deleted.`);
      setDeleteTarget(null);
      await loadInitialData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Quiz delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete quiz.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* ─── Hero Header ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment & Quizzes Studio</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Course Quizzes & Assessments
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Design comprehensive quizzes, evaluate student mastery with automated scoring,
              and test multiple question styles across your technical curriculum.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            id="create-quiz-button"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Quiz</span>
          </button>
        </div>

        {/* Ambient background glow accents */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-20 w-60 h-60 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ─── Quick Metric Counters ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Quizzes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.published}</div>
            <div className="text-xs font-medium text-slate-500">Published Active Quizzes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalQuestions}</div>
            <div className="text-xs font-medium text-slate-500">Total Evaluated Questions</div>
          </div>
        </div>
      </div>

      {/* ─── Alerts & Banners ─── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-xs text-rose-600 underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or course name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* ─── Quizzes Listing (Requirement 2) ─── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading course quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-16 px-6 bg-white rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Quizzes Found</h3>
            <p className="text-sm text-slate-500">
              {search || courseFilter !== 'all' || statusFilter !== 'all'
                ? 'No quizzes match your current filters. Try resetting search criteria.'
                : 'You have not created any quizzes yet. Add your first assessment to evaluate your students!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuizzes.map((quiz) => {
            const courseTitle = quiz.courseId?.title || 'Standalone Course';
            const questionCount = quiz.questions?.length || 0;
            const status = quiz.status || 'published';

            return (
              <div
                key={quiz._id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                        status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {status}
                    </span>

                    {/* Course Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 truncate max-w-xs">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{courseTitle}</span>
                    </span>

                    {/* Passing Score Badge */}
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      Pass: {quiz.passingScore || 50}%
                    </span>

                    {/* Max Attempts Badge */}
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                      {quiz.maxAttempts && quiz.maxAttempts > 0
                        ? `${quiz.maxAttempts} Attempts Max`
                        : 'Unlimited Attempts'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Quiz Metadata Row */}
                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <FileQuestion className="w-3.5 h-3.5 text-blue-500" />
                      {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.timeLimit && quiz.timeLimit > 0
                        ? `${quiz.timeLimit} Minutes`
                        : 'No Time Limit'}
                    </span>

                    {quiz.createdAt && (
                      <span className="text-slate-400">
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Edit and Delete (Requirement 2) */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => handleOpenEdit(quiz)}
                    id={`edit-quiz-${quiz._id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget(quiz)}
                    id={`delete-quiz-${quiz._id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create / Edit Quiz Modal (Requirements 3, 4, 5, 6) ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingQuizId ? 'Edit Quiz Assessment' : 'Create New Course Quiz'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure general settings and build interactive questions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Errors Box */}
            {formErrors.length > 0 && (
              <div className="px-6 pt-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Please correct the following errors before saving:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Modal Body Scrollable */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-8 flex-1">
              {/* Section 1: Quiz Details (Requirement 3) */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">General Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title (Required) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Quiz Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., React Hooks, Component State & Lifecycle Quiz"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Course Dropdown (Required, Instructor's own courses) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Assigned Course <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select your course...</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Limit (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Time Limit (Minutes)
                      <span className="text-slate-400 font-normal">(0 = No limit)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      placeholder="15"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief overview explaining what concepts are covered in this quiz..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Status & Passing Score */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Publication Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="published">Published (Learners can take)</option>
                      <option value="draft">Draft (Work in progress)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Passing Score Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Max Attempts Allowed
                      <span className="text-slate-400 font-normal">(0 = Unlimited)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Questions Builder (Requirements 4 & 5) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-blue-600" />
                      Questions ({formData.questions.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add and configure questions. Reorder using the Up / Down arrows.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    id="add-question-btn"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question</span>
                  </button>
                </div>

                {/* List of Questions with reordering (Requirement 5) */}
                <div className="space-y-6">
                  {formData.questions.map((q, qIndex) => {
                    const qType = q.type || 'single_choice';

                    return (
                      <div
                        key={q._tempId || qIndex}
                        className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
                      >
                        {/* Question Card Header with Reordering Controls */}
                        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                              {qIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              Question {qIndex + 1} of {formData.questions.length}
                            </span>
                          </div>

                          {/* Reordering Up/Down & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(qIndex, 'up')}
                              disabled={qIndex === 0}
                              title="Move Question Up"
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(qIndex, 'down')}
                              disabled={qIndex === formData.questions.length - 1}
                              title="Move Question Down"
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            <div className="w-px h-4 bg-slate-200 mx-1" />

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIndex)}
                              title="Delete Question"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Details Body */}
                        <div className="p-5 space-y-4">
                          {/* Question Type Selector (Requirement 4) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              Question Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {QUESTION_TYPES.map((qt) => {
                                const Icon = qt.icon;
                                const isSelected = qType === qt.type;

                                return (
                                  <button
                                    key={qt.type}
                                    type="button"
                                    onClick={() => handleQuestionFieldChange(qIndex, 'type', qt.type)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50/80 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                  >
                                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className="text-xs font-bold">{qt.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Question Text (Required) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              Question Text <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={q.questionText}
                              onChange={(e) => handleQuestionFieldChange(qIndex, 'questionText', e.target.value)}
                              placeholder="e.g. What hook is used in React to manage side-effects?"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Dynamic Inputs based on Question Type */}
                          {/* TYPE 1: MCQ Single Answer */}
                          {qType === 'single_choice' && (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700">
                                  Answer Options (Select the single correct radio option)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(qIndex)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Option
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(q.options || []).map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2.5">
                                    <input
                                      type="radio"
                                      name={`correct_single_${qIndex}`}
                                      checked={q.correctOptionIndex === optIdx}
                                      onChange={() => handleQuestionFieldChange(qIndex, 'correctOptionIndex', optIdx)}
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {q.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(qIndex, optIdx)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TYPE 2: MCQ Multiple Answer */}
                          {qType === 'multiple_choice' && (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700">
                                  Answer Options (Check all options that are correct)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(qIndex)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Option
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(q.options || []).map((opt, optIdx) => {
                                  const isChecked = (q.correctOptions || []).includes(optIdx);

                                  return (
                                    <div key={optIdx} className="flex items-center gap-2.5">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleMultipleChoiceOption(qIndex, optIdx)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      {q.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOption(qIndex, optIdx)}
                                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* TYPE 3: True / False */}
                          {qType === 'true_false' && (
                            <div className="space-y-2 pt-1">
                              <label className="text-xs font-bold text-slate-700">
                                Correct Answer (Select True or False)
                              </label>
                              <div className="grid grid-cols-2 gap-3 max-w-sm">
                                <button
                                  type="button"
                                  onClick={() => handleQuestionFieldChange(qIndex, 'correctBoolean', true)}
                                  className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    q.correctBoolean === true
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <Check className="w-4 h-4" /> True
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuestionFieldChange(qIndex, 'correctBoolean', false)}
                                  className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    q.correctBoolean === false
                                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <X className="w-4 h-4" /> False
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TYPE 4: Short Answer */}
                          {qType === 'short_answer' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700">
                                  Accepted Answer(s) (Graded case-insensitively)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddAcceptedAnswer(qIndex)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Variant
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(q.acceptedAnswers || []).map((ans, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={ans}
                                      onChange={(e) => handleAcceptedAnswerChange(qIndex, aIdx, e.target.value)}
                                      placeholder="e.g., POST"
                                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {q.acceptedAnswers.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAcceptedAnswer(qIndex, aIdx)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Explanation (Optional) */}
                          <div className="space-y-1 pt-1">
                            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                              Explanation / Feedback Note (Optional)
                            </label>
                            <input
                              type="text"
                              value={q.explanation || ''}
                              onChange={(e) => handleQuestionFieldChange(qIndex, 'explanation', e.target.value)}
                              placeholder="Brief hint or rationale shown to students after evaluation"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={isSubmitting}
                id="save-quiz-btn"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingQuizId ? 'Update Quiz' : 'Publish Quiz'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Quiz</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-800">"{deleteTarget.title}"</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={isDeleting}
                id="confirm-delete-quiz-btn"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorQuizzes;
