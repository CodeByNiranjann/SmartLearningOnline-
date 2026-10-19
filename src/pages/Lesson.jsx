import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchLessonDetails,
  fetchLessonResources,
  completeLesson,
  completeModule,
  fetchCourseProgress,
  updatePlaybackProgress,
  enrollCourse,
  logStudyTime,
  fetchLessonQuiz,
  submitQuiz,
  fetchLessonExercises,
  submitExercise,
  getExerciseSubmissionFileUrl,
  getExerciseAttachmentUrl,
  fetchLessonProgress,
  updateLessonProgress,
  markLessonComplete,
  fetchEnrollmentProgress,
  fetchCourseEnrollment,
} from '../services/api';
import ResourceCard from '../components/ResourceCard';
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
  AlertCircle,
  Play,
  Maximize2,
  Minimize2,
  VideoOff,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Menu,
  X,
  GraduationCap,
  HelpCircle,
  Check,
  Award,
  Code2,
  UploadCloud,
  Download,
  FileCode,
  Paperclip,
  Send,
  Save,
  Loader2,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';

// Extract YouTube ID from any format (standard, short, embed, shorts)
const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const formatSeconds = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const getExperimentFormatGuidance = (exerciseType) => {
  switch (exerciseType) {
    case 'Coding Exercise':
      return {
        accept: '.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.zip',
        label: 'Source Code or Archive',
        badge: '.js, .py, .java, .cpp, .html, .css, .zip',
        description: 'Upload your completed code file (.js, .py, etc.) or compressed archive (.zip) for this experiment.',
      };
    case 'File Upload':
      return {
        accept: '.pdf,.txt,.zip,.doc,.docx',
        label: 'Lab Document or Report',
        badge: '.pdf, .txt, .zip, .docx',
        description: 'Upload your lab report, experiment documentation, or solution package.',
      };
    case 'Project Task':
      return {
        accept: '.zip,.pdf,.tar.gz,.js,.py,.html',
        label: 'Project Deliverable',
        badge: '.zip, .pdf, .tar.gz, source files',
        description: 'Upload your completed project package (.zip), architectural diagram (.pdf), or source files.',
      };
    case 'Text Answer':
      return {
        accept: '.txt,.pdf,.md',
        label: 'Answer Document',
        badge: '.txt, .md, .pdf or text',
        description: 'Submit an answer file (.txt, .md, .pdf) or write your solution in the answer box.',
      };
    default:
      return {
        accept: '.pdf,.txt,.zip,.js,.py',
        label: 'Experiment Solution File',
        badge: '.pdf, .txt, .zip, source files',
        description: 'Upload your experiment solution file (up to 10 MB limit).',
      };
  }
};

const Lesson = () => {
  const { courseId, lessonId } = useParams();

  const [lessonData, setLessonData] = useState(null);
  const [resources, setResources] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Enrollment-scoped persistent progress tracking (SLP-10)
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [enrollmentLessonMap, setEnrollmentLessonMap] = useState({});
  const [progressRestoring, setProgressRestoring] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lastSavedPosition, setLastSavedPosition] = useState(0);

  // References for playback tracking & safe periodic updates
  const ytPlayerRef = useRef(null);
  const currentPositionRef = useRef(0);
  const currentDurationRef = useRef(0);
  const isCompletedRef = useRef(false);

  // Player & UI states
  const [theaterMode, setTheaterMode] = useState(false);
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'resources'
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const [videoPlaybackStarted, setVideoPlaybackStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [notEnrolled, setNotEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Experiment File Upload & Solution State
  const [activeUploadExId, setActiveUploadExId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadTexts, setUploadTexts] = useState({});
  const [uploadingState, setUploadingState] = useState({});
  const [uploadError, setUploadError] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});

  const handleFileSelection = (exId, file) => {
    setUploadError((prev) => ({ ...prev, [exId]: '' }));
    if (!file) {
      setUploadFiles((prev) => {
        const copy = { ...prev };
        delete copy[exId];
        return copy;
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError((prev) => ({
        ...prev,
        [exId]: 'File exceeds the 10 MB limit. Please select a smaller file.',
      }));
      return;
    }

    setUploadFiles((prev) => ({ ...prev, [exId]: file }));
  };

  const handleExperimentFileUpload = async (exercise, saveAsDraft = false) => {
    const exId = exercise._id;
    const file = uploadFiles[exId];
    const text = uploadTexts[exId] || '';

    setUploadError((prev) => ({ ...prev, [exId]: '' }));
    setUploadSuccess((prev) => ({ ...prev, [exId]: '' }));

    if (!saveAsDraft) {
      if (exercise.exerciseType === 'File Upload' && !file && !exercise.mySubmission?.fileReference) {
        setUploadError((prev) => ({
          ...prev,
          [exId]: 'Please select a file to upload for this experiment.',
        }));
        return;
      }
      if (exercise.exerciseType === 'Text Answer' && !text.trim() && !file) {
        setUploadError((prev) => ({
          ...prev,
          [exId]: 'Please provide your text answer or upload an answer document.',
        }));
        return;
      }
      if (!file && !text.trim() && !exercise.mySubmission) {
        setUploadError((prev) => ({
          ...prev,
          [exId]: 'Please upload your experiment file or enter your solution before submitting.',
        }));
        return;
      }
    }

    try {
      setUploadingState((prev) => ({ ...prev, [exId]: true }));
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (text.trim()) {
        formData.append('textAnswer', text.trim());
      }
      if (saveAsDraft) {
        formData.append('saveAsDraft', 'true');
      }

      const res = await submitExercise(exId, formData);
      setUploadSuccess((prev) => ({
        ...prev,
        [exId]: saveAsDraft ? 'Draft saved successfully!' : 'Experiment solution submitted successfully!',
      }));

      // Update exercise list locally
      setExercises((prevList) =>
        prevList.map((item) => {
          if (item._id === exId) {
            return {
              ...item,
              mySubmission: res.submission,
            };
          }
          return item;
        })
      );

      // Clean up selected file
      setUploadFiles((prev) => {
        const copy = { ...prev };
        delete copy[exId];
        return copy;
      });

      setTimeout(() => {
        setUploadSuccess((prev) => ({ ...prev, [exId]: '' }));
      }, 5000);
    } catch (err) {
      console.error('Experiment upload error:', err);
      setUploadError((prev) => ({
        ...prev,
        [exId]: err.response?.data?.message || 'Failed to submit experiment file. Please check file format and size.',
      }));
    } finally {
      setUploadingState((prev) => ({ ...prev, [exId]: false }));
    }
  };

  // Load lesson data, resources, quiz, and student progress
  const loadLessonData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      setVideoError(false);
      setQuizResult(null);
      setQuizAnswers({});
      setQuizError('');
      setResumeSeconds(0);

      const [details, resList, progressData, quizData, exData] = await Promise.all([
        fetchLessonDetails(lessonId),
        fetchLessonResources(lessonId),
        fetchCourseProgress(courseId).catch((err) => {
          if (err.response?.status === 403) {
            setNotEnrolled(true);
          }
          return null;
        }),
        fetchLessonQuiz(lessonId).catch(() => null),
        fetchLessonExercises(lessonId).catch(() => ({ exercises: [] })),
      ]);

      setLessonData(details);
      setResources(resList || []);
      setQuiz(quizData);
      setExercises(exData?.exercises || []);

      if (progressData) {
        setNotEnrolled(false);
        const rawCompleted = progressData.completedLessons || [];
        const completedIds = rawCompleted.map((id) =>
          typeof id === 'object' && id?._id ? id._id.toString() : id?.toString()
        );
        setCompletedLessonIds(completedIds);
        const isComp = completedIds.includes(lessonId?.toString());
        setIsCompleted(isComp);
        isCompletedRef.current = isComp;

        // Restore playback resume position if available from progress
        if (Array.isArray(progressData.playbackProgress)) {
          const pb = progressData.playbackProgress.find(
            (p) => p.lessonId?.toString() === lessonId.toString()
          );
          if (pb && pb.playedSeconds > 0 && !pb.completed) {
            setResumeSeconds(pb.playedSeconds);
            setLastSavedPosition(pb.playedSeconds);
            currentPositionRef.current = pb.playedSeconds;
          }
        }
      }

      // Check enrollment-scoped LessonProgress (SLP-10)
      let enrId = progressData?.enrollmentId;
      if (!enrId) {
        try {
          const enrStatus = await fetchCourseEnrollment(courseId);
          if (enrStatus?.enrollment?._id) {
            enrId = enrStatus.enrollment._id;
          }
        } catch (e) {
          // not enrolled
        }
      }

      if (enrId) {
        setEnrollmentId(enrId);
        setProgressRestoring(true);
        try {
          const [lp, ep] = await Promise.all([
            fetchLessonProgress(enrId, lessonId).catch(() => null),
            fetchEnrollmentProgress(enrId).catch(() => null),
          ]);

          if (lp) {
            setLessonProgress(lp);
            if (lp.status === 'COMPLETED') {
              setIsCompleted(true);
              isCompletedRef.current = true;
            }
            if (lp.lastPositionSeconds > 0 && lp.status !== 'COMPLETED') {
              setResumeSeconds(lp.lastPositionSeconds);
              setLastSavedPosition(lp.lastPositionSeconds);
              currentPositionRef.current = lp.lastPositionSeconds;
            }
            if (lp.durationSeconds > 0) {
              currentDurationRef.current = lp.durationSeconds;
            }
          }

          if (ep && Array.isArray(ep.lessons)) {
            const map = {};
            for (const item of ep.lessons) {
              map[item.lessonId.toString()] = item;
            }
            setEnrollmentLessonMap(map);
          }
        } catch (e) {
          console.warn('Could not restore lesson progress from enrollment:', e);
        } finally {
          setProgressRestoring(false);
        }
      }

      // Restore playback state from localStorage if available
      try {
        const savedState = localStorage.getItem(`lesson_playback_${lessonId}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setVideoPlaybackStarted(Boolean(parsed.started));
        } else {
          setVideoPlaybackStarted(false);
        }
      } catch (e) {
        // ignore localStorage errors
      }
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('Failed to load lesson content. The lesson may be unavailable or deleted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  // Track active study minutes on website for calendar heatmap
  useEffect(() => {
    if (notEnrolled || !courseId) return;

    // Log 1 minute of study time on arrival, then every 60s of active learning
    logStudyTime({ courseId, minutes: 1 }).catch(() => {});

    const timer = setInterval(() => {
      if (!notEnrolled && courseId) {
        logStudyTime({ courseId, minutes: 1 }).catch(() => {});
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [courseId, lessonId, notEnrolled]);

  // Determine YouTube ID from lesson.videoUrl, lesson.content, or video resources
  const youtubeVideoId = useMemo(() => {
    if (!lessonData?.lesson) return null;
    const lesson = lessonData.lesson;

    // 1. Direct videoUrl on lesson
    if (lesson.videoUrl) {
      const id = extractYouTubeId(lesson.videoUrl);
      if (id) return id;
    }

    // 2. URL embedded in lesson content
    if (lesson.content) {
      const id = extractYouTubeId(lesson.content);
      if (id) return id;
    }

    // 3. Attached Video resource
    if (resources && resources.length > 0) {
      const videoResource = resources.find(
        (r) => r.type === 'Video' || (r.url && extractYouTubeId(r.url))
      );
      if (videoResource?.url) {
        const id = extractYouTubeId(videoResource.url);
        if (id) return id;
      }
    }

    return null;
  }, [lessonData, resources]);

  // ─── Quiz handlers ───
  const handleQuizAnswerSelect = (questionId, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz) return;

    const formattedAnswers = Object.entries(quizAnswers).map(([qId, optIdx]) => ({
      questionId: qId,
      selectedOptionIndex: optIdx,
    }));

    if (formattedAnswers.length < quiz.questions.length) {
      setQuizError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmittingQuiz(true);
      setQuizError('');
      const result = await submitQuiz(quiz._id, formattedAnswers);
      setQuizResult(result);
      if (result.passed && !isCompleted && !notEnrolled) {
        // Auto-mark lesson complete on passing quiz
        handleMarkComplete();
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      setQuizError(err.response?.data?.message || 'Error grading quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
  };

  // ─── Playback Progress Persistence & Synchronization (SLP-10) ───────────
  const savePlaybackProgress = useCallback(
    async ({ position, duration, completed: markComplete = false }) => {
      const safePos = Math.max(0, Math.round(Number(position) || 0));
      const safeDur = Math.max(0, Math.round(Number(duration) || 0));

      currentPositionRef.current = safePos;
      if (safeDur > 0) currentDurationRef.current = safeDur;

      if (!notEnrolled && enrollmentId) {
        try {
          setSavingProgress(true);
          setSaveError('');
          const updated = await updateLessonProgress(enrollmentId, lessonId, {
            last_position_seconds: safePos,
            duration_seconds: safeDur,
            completed: Boolean(markComplete),
          });

          setLessonProgress(updated);
          setLastSavedPosition(updated.lastPositionSeconds || safePos);

          if (updated.status === 'COMPLETED') {
            setIsCompleted(true);
            isCompletedRef.current = true;
            setCompletedLessonIds((prev) => Array.from(new Set([...prev, lessonId.toString()])));
          }

          setEnrollmentLessonMap((prev) => ({
            ...prev,
            [lessonId.toString()]: updated,
          }));
        } catch (err) {
          console.error('Error saving playback progress:', err);
          setSaveError('Progress save failed. Retrying...');
          setTimeout(() => {
            if (enrollmentId) {
              updateLessonProgress(enrollmentId, lessonId, {
                last_position_seconds: safePos,
                duration_seconds: safeDur,
                completed: Boolean(markComplete),
              })
                .then((res) => {
                  setSaveError('');
                  setLessonProgress(res);
                })
                .catch(() => {
                  setSaveError('Progress could not be saved to server. Click Retry.');
                });
            }
          }, 5000);
        } finally {
          setSavingProgress(false);
        }
      } else if (!notEnrolled && courseId) {
        // Fallback to legacy playback route if enrollmentId is still resolving
        try {
          await updatePlaybackProgress({
            courseId,
            lessonId,
            playedSeconds: safePos,
            durationSeconds: safeDur,
            completed: markComplete,
          });
        } catch (e) {
          // silent fallback
        }
      }
    },
    [enrollmentId, notEnrolled, courseId, lessonId]
  );

  // Handle Mark Lesson Complete (Idempotent and scoped to enrollment)
  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      setError('');
      setSaveError('');

      let res;
      if (enrollmentId) {
        res = await markLessonComplete(enrollmentId, lessonId);
      } else {
        res = await completeLesson(courseId, lessonId);
      }

      setIsCompleted(true);
      isCompletedRef.current = true;
      setCompletedLessonIds((prev) => Array.from(new Set([...prev, lessonId.toString()])));

      if (res?.progress) {
        setLessonProgress(res.progress);
        setEnrollmentLessonMap((prev) => ({
          ...prev,
          [lessonId.toString()]: res.progress,
        }));
      }

      if (res?.isAlreadyCompleted) {
        setSuccessMsg('Lesson was already marked as complete (idempotent). Progress maintained.');
      } else {
        setSuccessMsg('Lesson completed successfully! Progress saved.');
      }

      // Persist in localStorage as secondary backup
      localStorage.setItem(
        `lesson_playback_${lessonId}`,
        JSON.stringify({ started: true, completed: true, timestamp: Date.now() })
      );
      // Persist in localStorage and update playback state
      try {
        localStorage.setItem(
          `lesson_playback_${lessonId}`,
          JSON.stringify({ started: true, completed: true, timestamp: Date.now() })
        );
      } catch (e) {
        // ignore localStorage errors
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      const msg =
        err.response?.data?.message ||
        'Could not update lesson progress. Please check your connection.';
      setError(msg);
      setSaveError(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Handle Mark Entire Module Complete
  const handleMarkModuleComplete = async (targetModuleId) => {
    try {
      setCompleting(true);
      setError('');
      const res = await completeModule(courseId, targetModuleId);

      const updatedIds = (res?.progress?.completedLessons || []).map((id) =>
        typeof id === 'object' && id?._id ? id._id.toString() : id?.toString()
      );
      setCompletedLessonIds(updatedIds);

      if (updatedIds.includes(lessonId?.toString())) {
        setIsCompleted(true);
        isCompletedRef.current = true;
      }

      setSuccessMsg(`🎉 Module Completed! ${res.message || 'All lessons in this module are complete.'}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error marking module complete:', err);
      const msg = err.response?.data?.message || 'Could not complete module. Please try again.';
      setError(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Handle Enrollment from preview mode
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError('');
      await enrollCourse(courseId);
      setNotEnrolled(false);
      setSuccessMsg('Successfully enrolled in this course! Your progress will now be tracked.');
      loadLessonData();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // Record playback start and sync with backend
  const handleVideoStart = async () => {
    setVideoPlaybackStarted(true);
    try {
      localStorage.setItem(
        `lesson_playback_${lessonId}`,
        JSON.stringify({ started: true, timestamp: Date.now() })
      );
    } catch (e) {
      // ignore localStorage errors
    }

    if (resumeSeconds > 0 && ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(resumeSeconds, true);
      } catch (e) {}
    }

    savePlaybackProgress({
      position: resumeSeconds || 1,
      duration: currentDurationRef.current || 600,
    });
  };

  // YouTube IFrame API Lifecycle & Periodic Progress Synchronization
  useEffect(() => {
    if (!youtubeVideoId) return;

    let pollInterval = null;
    let isDisposed = false;

    const handleStateChange = (event) => {
      const player = event.target;
      // event.data: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
      if (event.data === 1) {
        setVideoPlaybackStarted(true);
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => {
          if (isDisposed) return;
          try {
            if (player && typeof player.getCurrentTime === 'function') {
              const pos = Math.floor(player.getCurrentTime());
              const dur = Math.floor(player.getDuration() || currentDurationRef.current);
              currentPositionRef.current = pos;
              if (dur > 0) currentDurationRef.current = dur;

              // 90% threshold for automatic video lesson completion
              const reachedThreshold = dur > 0 && pos >= Math.floor(dur * 0.9);
              savePlaybackProgress({
                position: pos,
                duration: dur,
                completed: reachedThreshold,
              });
            }
          } catch (e) {}
        }, 10000);
      } else if (event.data === 2) {
        // Paused: save immediately
        if (pollInterval) clearInterval(pollInterval);
        try {
          if (player && typeof player.getCurrentTime === 'function') {
            const pos = Math.floor(player.getCurrentTime());
            const dur = Math.floor(player.getDuration() || currentDurationRef.current);
            currentPositionRef.current = pos;
            if (dur > 0) currentDurationRef.current = dur;
            savePlaybackProgress({ position: pos, duration: dur });
          }
        } catch (e) {}
      } else if (event.data === 0) {
        // Ended: mark lesson completed
        if (pollInterval) clearInterval(pollInterval);
        try {
          if (player && typeof player.getDuration === 'function') {
            const dur = Math.floor(player.getDuration() || currentDurationRef.current);
            currentPositionRef.current = dur;
            savePlaybackProgress({ position: dur, duration: dur, completed: true });
          }
        } catch (e) {}
      }
    };

    const initYT = () => {
      if (window.YT && window.YT.Player) {
        try {
          new window.YT.Player('lesson-youtube-player-frame', {
            events: {
              onReady: (event) => {
                ytPlayerRef.current = event.target;
                if (resumeSeconds > 0) {
                  event.target.seekTo(resumeSeconds, true);
                }
                const dur = Math.floor(event.target.getDuration() || 0);
                if (dur > 0) currentDurationRef.current = dur;
              },
              onStateChange: handleStateChange,
            },
          });
        } catch (e) {
          console.warn('YouTube Player initialization warning:', e);
        }
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYT;
    } else {
      initYT();
    }

    const handleBeforeUnload = () => {
      if (currentPositionRef.current > 0) {
        savePlaybackProgress({
          position: currentPositionRef.current,
          duration: currentDurationRef.current,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isDisposed = true;
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentPositionRef.current > 0) {
        savePlaybackProgress({
          position: currentPositionRef.current,
          duration: currentDurationRef.current,
        });
      }
    };
  }, [youtubeVideoId, resumeSeconds, savePlaybackProgress]);

  // For text or non-video lessons: auto-track engagement and start state
  useEffect(() => {
    if (youtubeVideoId || notEnrolled || !enrollmentId) return;

    const textTimer = setTimeout(() => {
      if (!isCompleted && (!lessonProgress || lessonProgress.status === 'NOT_STARTED')) {
        savePlaybackProgress({ position: 5, duration: 60 });
      }
    }, 5000);

    return () => clearTimeout(textTimer);
  }, [youtubeVideoId, notEnrolled, enrollmentId, isCompleted, lessonProgress, savePlaybackProgress]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading lesson workspace & video player...</p>
        </div>
      </div>
    );
  }

  // Error / Unavailable Lesson State
  if (error || !lessonData?.lesson) {
    return (
      <div className="bg-white border border-slate-200/80 p-8 md:p-12 rounded-3xl text-center space-y-5 max-w-lg mx-auto my-12 shadow-xl shadow-slate-200/50">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Lesson Unavailable</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error || 'This lesson content is currently not reachable or has been moved by the instructor.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={loadLessonData}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
          <Link
            to={`/courses/${courseId}`}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Course Path
          </Link>
        </div>
      </div>
    );
  }

  const {
    lesson,
    prevLessonId,
    prevLessonTitle,
    nextLessonId,
    nextLessonTitle,
    totalCourseLessons,
    currentLessonIndex,
    modules,
  } = lessonData;

  const currentModule = modules?.find((m) => m._id?.toString() === lesson.moduleId?.toString());
  const currentModuleLessons = currentModule?.lessons || [];
  const currentModuleCompletedCount = currentModuleLessons.filter((l) =>
    completedLessonIds.includes(l._id?.toString())
  ).length;
  const isCurrentModuleCompleted =
    currentModuleLessons.length > 0 && currentModuleCompletedCount === currentModuleLessons.length;

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* ─── Top Bar: Navigation & Progress ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Course
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-medium">
            Lesson <strong className="text-slate-900">{currentLessonIndex}</strong> of {totalCourseLessons}
          </span>
          {currentModule && (
            <>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span
                className="text-xs text-slate-600 font-medium truncate max-w-[200px] hidden sm:inline"
                title={currentModule.title}
              >
                {currentModule.title}
              </span>
            </>
          )}
          {isCurrentModuleCompleted && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
              <CheckCircle className="w-3 h-3" /> Module Completed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Curriculum Drawer Toggle */}
          <button
            onClick={() => setMobileCurriculumOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Curriculum</span>
          </button>

          {/* Theater Mode Toggle (Desktop only) */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            title={theaterMode ? 'Normal View' : 'Theater Mode (Wide)'}
          >
            {theaterMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Normal View
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Theater Mode
              </>
            )}
          </button>

          {isCompleted && (
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </span>
          )}
        </div>
      </div>

      {/* ─── Enrollment Warning Banner (Scoped to Enrollment) ─── */}
      {notEnrolled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Preview Mode</p>
              <p className="text-amber-700 mt-0.5">
                You are previewing this lesson. Enroll in this course to save completion progress and track video playback.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-60"
          >
            <GraduationCap className="w-4 h-4" />
            <span>{enrolling ? 'Enrolling...' : 'Enroll in Course'}</span>
          </button>
        </div>
      )}

      {/* ─── Success Notification Banner ─── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {nextLessonId && (
            <Link
              to={`/learning/${courseId}/${nextLessonId}`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shrink-0"
            >
              Next Lesson <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* ─── Main Grid Layout ─── */}
      <div className={`grid grid-cols-1 ${theaterMode ? 'gap-8' : 'lg:grid-cols-3 gap-8'}`}>
        {/* Left Column (or Full Width in Theater Mode) */}
        <div className={theaterMode ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
          {/* ─── VIDEO PLAYER SECTION ─── */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {youtubeVideoId && !videoError ? (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  id="lesson-youtube-player-frame"
                  className="w-full h-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1${
                    resumeSeconds > 0 ? `&start=${Math.floor(resumeSeconds)}` : ''
                  }`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={handleVideoStart}
                  onError={() => setVideoError(true)}
                />
              </div>
            ) : (
              /* ─── CLEAR UNAVAILABLE CONTENT STATE ─── */
              <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-lg font-bold tracking-tight text-white">Video Stream Unavailable</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A dedicated video stream is not attached to this lesson yet or is temporarily offline. All lesson concepts and instructions are provided in the structured reading notes below.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const notesEl = document.getElementById('lesson-reading-content');
                      if (notesEl) notesEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read Lesson Notes
                  </button>
                  {nextLessonId && (
                    <Link
                      to={`/learning/${courseId}/${nextLessonId}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      Next Lesson <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Playback Controls & Status Bar */}
            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-300">
                  {youtubeVideoId ? 'Interactive YouTube Player' : 'Text Lesson Mode'}
                </span>
                {lesson.duration && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> {lesson.duration}
                    </span>
                  </>
                )}

                {/* Status Indicator Badge */}
                {isCompleted || lessonProgress?.status === 'COMPLETED' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Completed
                  </span>
                ) : lessonProgress?.status === 'IN_PROGRESS' || resumeSeconds > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-current" /> In Progress ({lessonProgress?.progressPercentage || Math.min(99, Math.round(((resumeSeconds || 1) / (currentDurationRef.current || 600)) * 100))}%)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                    Not Started
                  </span>
                )}

                {resumeSeconds > 0 && !isCompleted && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[10px] font-semibold flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Resumed at {formatSeconds(resumeSeconds)}
                  </span>
                )}

                {progressRestoring && (
                  <span className="flex items-center gap-1.5 text-blue-300 text-[10px] font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> Restoring saved position...
                  </span>
                )}

                {savingProgress && (
                  <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving progress...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {youtubeVideoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Progress Save Error Banner */}
          {saveError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{saveError}</span>
              </div>
              <button
                onClick={() =>
                  savePlaybackProgress({
                    position: currentPositionRef.current || resumeSeconds,
                    duration: currentDurationRef.current || 600,
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* ─── LESSON OVERVIEW & DETAILS ─── */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Lesson {currentLessonIndex}
                </span>
                {lesson.duration && (
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {lesson.duration}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-slate-600 text-sm leading-relaxed">{lesson.description}</p>
              )}
            </div>

            {/* Reading Content */}
            <div id="lesson-reading-content" className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Lesson Content & Notes
              </h3>
              <div className="text-slate-800 text-sm md:text-base leading-relaxed space-y-4">
                {lesson.content ? (
                  lesson.content.split('\n\n').map((paragraph, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 p-4 md:p-5 rounded-2xl border border-slate-200/80 whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-800 leading-relaxed"
                    >
                      {paragraph}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No additional reading notes provided for this lesson.
                  </p>
                )}
              </div>
            </div>

            {/* ─── Knowledge Check Assessment (SLP-17 & SLP-18) ─── */}
            {/* ─── Knowledge Check Assessment ─── */}
            {quiz && (
              <div className="mt-8 pt-8 border-t border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                        {quiz.title || 'Lesson Assessment'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Test your understanding to reinforce core concepts. Passing score: {quiz.passingScore}%
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {quiz.questions?.length || 0} Questions
                  </span>
                </div>

                {quizError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{quizError}</span>
                  </div>
                )}

                {!quizResult ? (
                  /* Quiz Taking Form */
                  <form onSubmit={handleSubmitQuiz} className="space-y-6">
                    {quiz.questions.map((q, qIdx) => (
                      <fieldset
                        key={q._id || qIdx}
                        className="p-4 md:p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3"
                      >
                        <legend className="text-xs md:text-sm font-bold text-slate-800 px-1">
                          Question {qIdx + 1}: {q.questionText}
                        </legend>
                        <div role="radiogroup" aria-label={`Question ${qIdx + 1}`} className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[q._id] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs md:text-sm cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/60'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q._id}`}
                                  value={optIdx}
                                  checked={isSelected}
                                  onChange={() => handleQuizAnswerSelect(q._id, optIdx)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <span className="flex-1">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}

                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      <span className="text-xs text-slate-500">
                        {Object.keys(quizAnswers).length} of {quiz.questions.length} answered
                      </span>
                      <button
                        type="submit"
                        disabled={submittingQuiz}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                      >
                        {submittingQuiz ? 'Grading...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Quiz Result View */
                  <div className="space-y-6">
                    <div
                      className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        quizResult.passed
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50/80 border-amber-300 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                            quizResult.passed ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg">Score: {quizResult.score}%</span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                quizResult.passed
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {quizResult.passed ? 'Passed' : 'Needs Review'}
                            </span>
                          </div>
                          <p className="text-xs opacity-90 mt-0.5">
                            {quizResult.correctCount} of {quizResult.totalQuestions} questions correct (Passing:{' '}
                            {quizResult.passingScore}%)
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleRetakeQuiz}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
                      </button>
                    </div>

                    {/* Detailed Feedback Breakdown */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assessment Feedback & Explanations
                      </h3>
                      {quizResult.feedback?.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-xs space-y-2 ${
                            item.isCorrect
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800">
                              Q{idx + 1}: {item.questionText}
                            </p>
                            <span
                              className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                item.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {item.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            <strong>Your Answer:</strong>{' '}
                            {item.selectedOptionIndex !== null && item.selectedOptionIndex !== undefined
                              ? item.options[item.selectedOptionIndex]
                              : 'Not answered'}
                          </p>
                          {!item.isCorrect && (
                            <p className="text-emerald-700 font-medium">
                              <strong>Correct Answer:</strong> {item.options[item.correctOptionIndex]}
                            </p>
                          )}
                          {item.explanation && (
                            <p className="text-slate-500 italic bg-white/60 p-2 rounded-lg border border-slate-200/50">
                              💡 {item.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Hands-On Practical Experiments & Exercises (Sprint 2) ─── */}
            {exercises && exercises.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Hands-On Practical Experiments
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Interactive Lab
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Complete practical tasks, download experiment starter kits, and upload your files directly below.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {exercises.length} {exercises.length === 1 ? 'Experiment' : 'Experiments'} Attached
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {exercises.map((ex) => {
                    const status = ex.mySubmission?.submissionStatus || 'Not Started';
                    const isAccepted = status === 'Accepted';
                    const isSubmitted = status === 'Submitted';
                    const isNeedsRevision = status === 'Needs Revision';
                    const isInProgress = status === 'In Progress';
                    const isExpanded = activeUploadExId === ex._id;
                    const guidance = getExperimentFormatGuidance(ex.exerciseType);
                    const isUploading = uploadingState[ex._id];
                    const selectedFile = uploadFiles[ex._id];
                    const currentText = uploadTexts[ex._id] !== undefined ? uploadTexts[ex._id] : (ex.mySubmission?.textAnswer || '');

                    return (
                      <div
                        key={ex._id}
                        className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'border-blue-400 ring-2 ring-blue-500/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* ─── Experiment Summary Header ─── */}
                        <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 flex items-center gap-1">
                                {ex.exerciseType === 'Coding Exercise' && <Code2 className="w-3.5 h-3.5 text-emerald-600" />}
                                {ex.exerciseType === 'File Upload' && <UploadCloud className="w-3.5 h-3.5 text-blue-600" />}
                                {ex.exerciseType === 'Project Task' && <FolderGit2 className="w-3.5 h-3.5 text-amber-600" />}
                                {ex.exerciseType === 'Text Answer' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
                                <span>{ex.exerciseType}</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                {ex.difficulty}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> ~{ex.estimatedMinutes} mins
                              </span>
                              <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                                <Award className="w-3.5 h-3.5 text-amber-500" /> {ex.maximumMarks} Pts (Pass: {ex.passingMarks})
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-base">{ex.title}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{ex.description}</p>

                            {/* Download Experiment Materials (Starter Kit & Docs) */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                              {ex.experimentFile?.originalName && (
                                <a
                                  href={getExerciseAttachmentUrl(ex._id)}
                                  download
                                  title="Download experiment lab materials"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Starter Kit ({ex.experimentFile.originalName})</span>
                                </a>
                              )}
                              {ex.referenceMaterials?.map((ref, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{ref.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* ─── Actions & Current Status Chip ─── */}
                          <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                isAccepted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isNeedsRevision
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isSubmitted
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : isInProgress
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {status === 'Not Started' ? 'Not Started' : `Status: ${status}`}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveUploadExId(isExpanded ? null : ex._id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                  isExpanded
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                }`}
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>{isExpanded ? 'Hide Upload Panel' : status === 'Not Started' ? 'Upload Solution' : 'Upload / Resubmit'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <Link
                                to={`/exercises/${ex._id}`}
                                title="Open full dedicated lab workspace"
                                className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* ─── Previous Evaluation / Feedback Banner (if evaluated) ─── */}
                        {ex.mySubmission && (ex.mySubmission.marksAwarded !== null || ex.mySubmission.reviewerFeedback) && (
                          <div className="mx-5 mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800">
                                  Score: {ex.mySubmission.marksAwarded !== null ? `${ex.mySubmission.marksAwarded} / ${ex.maximumMarks} Pts` : 'Pending evaluation'}
                                </span>
                                {ex.mySubmission.marksAwarded !== null && (
                                  <span
                                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      ex.mySubmission.marksAwarded >= ex.passingMarks
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {ex.mySubmission.marksAwarded >= ex.passingMarks ? 'Passed' : 'Needs Revision'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ex.mySubmission.reviewerFeedback && (
                              <p className="text-slate-600 italic">
                                Feedback: "{ex.mySubmission.reviewerFeedback}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* ─── Active Upload Solution Panel (Based on Experiment) ─── */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50/70 p-5 space-y-4">
                            {/* Format Guidance Banner */}
                            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="font-bold block flex items-center gap-1.5">
                                  <FileCode className="w-4 h-4 text-blue-600" />
                                  Required Format for this {ex.exerciseType}:
                                </span>
                                <p className="text-blue-700">{guidance.description}</p>
                              </div>
                              <span className="px-2 py-1 rounded-md bg-white border border-blue-200 text-blue-800 font-mono text-[11px] font-semibold self-start sm:self-auto shrink-0">
                                {guidance.badge} (Max 10 MB)
                              </span>
                            </div>

                            {/* Notifications */}
                            {uploadSuccess[ex._id] && (
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{uploadSuccess[ex._id]}</span>
                              </div>
                            )}
                            {uploadError[ex._id] && (
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{uploadError[ex._id]}</span>
                              </div>
                            )}

                            {/* File Drag-and-Drop Area */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-slate-800">
                                Upload Experiment Solution File:
                              </label>

                              <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-4 bg-white transition-all text-center">
                                <input
                                  type="file"
                                  id={`file-input-${ex._id}`}
                                  accept={guidance.accept}
                                  onChange={(e) => handleFileSelection(ex._id, e.target.files[0])}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />

                                {selectedFile ? (
                                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl text-left">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                        <Paperclip className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 text-xs line-clamp-1">{selectedFile.name}</p>
                                        <p className="text-[11px] text-slate-500">
                                          {(selectedFile.size / 1024).toFixed(1)} KB · Ready for upload
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleFileSelection(ex._id, null);
                                      }}
                                      className="text-xs font-semibold text-rose-600 hover:underline px-2 py-1"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-1 py-2">
                                    <UploadCloud className="w-7 h-7 mx-auto text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-700">
                                      Drag & drop your solution file here, or <span className="text-blue-600 underline">browse</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      Accepted: {guidance.badge}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Currently Uploaded File Display (from earlier submission) */}
                            {ex.mySubmission?.fileReference?.originalName && (
                              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span className="text-slate-600 font-medium">Currently on file:</span>
                                  <strong className="text-slate-900 font-mono">
                                    {ex.mySubmission.fileReference.originalName}
                                  </strong>
                                  <span className="text-slate-400 text-[11px]">
                                    ({Math.round((ex.mySubmission.fileReference.size || 0) / 1024)} KB)
                                  </span>
                                </div>
                                <a
                                  href={getExerciseSubmissionFileUrl(ex.mySubmission._id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            )}

                            {/* Optional Notes or Inline Code Snippet */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-slate-800">
                                Solution Notes / Code Snippet (Optional):
                              </label>
                              <textarea
                                rows={3}
                                value={currentText}
                                onChange={(e) =>
                                  setUploadTexts((prev) => ({ ...prev, [ex._id]: e.target.value }))
                                }
                                placeholder="Add implementation notes, run instructions, or paste solution snippet..."
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>

                            {/* Actions bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <Link
                                to={`/exercises/${ex._id}`}
                                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open Full-Screen Lab Workspace</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>

                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  disabled={isUploading}
                                  onClick={() => handleExperimentFileUpload(ex, true)}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Save Draft</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isUploading}
                                  onClick={() => handleExperimentFileUpload(ex, false)}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {isUploading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isUploading ? 'Uploading...' : 'Submit Experiment'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Bottom Actions Bar (Navigation & Completion) ─── */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleMarkComplete}
                  disabled={completing || isCompleted}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer active:scale-95'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isCompleted ? 'Completed ✓' : completing ? 'Saving Progress...' : 'Mark as Complete'}</span>
                </button>

                {!isCurrentModuleCompleted && lesson.moduleId && (
                  <button
                    onClick={() => handleMarkModuleComplete(lesson.moduleId)}
                    disabled={completing}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer"
                    title="Mark all lessons in this module complete"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Module</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {prevLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${prevLessonId}`}
                    title={prevLessonTitle ? `Previous: ${prevLessonTitle}` : 'Previous Lesson'}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200/60 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200/60">
                    Previous
                  </span>
                )}

                {nextLessonId ? (
                  <Link
                    to={`/learning/${courseId}/${nextLessonId}`}
                    title={nextLessonTitle ? `Next: ${nextLessonTitle}` : 'Next Lesson'}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                  >
                    <span>
                      {lessonData.isNextLessonInNewModule
                        ? `Next Module: ${lessonData.nextLessonModuleTitle || 'Next'}`
                        : 'Next Lesson'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/courses/${courseId}`}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-500/20"
                  >
                    <span>Complete Course</span>
                    <Sparkles className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Curriculum & Resources Sidebar ─── */}
        <div className={theaterMode ? 'space-y-6 max-w-4xl mx-auto w-full' : 'space-y-6'}>
          {/* Tabs Control */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'curriculum'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Curriculum</span>
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'resources'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Resources ({resources.length})</span>
              </button>
            </div>

            {/* TAB 1: CURRICULUM NAVIGATION */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {modules && modules.length > 0 ? (
                  modules.map((mod, modIdx) => {
                    const modLessons = mod.lessons || [];
                    const modDoneCount = modLessons.filter((l) =>
                      completedLessonIds.includes(l._id?.toString())
                    ).length;
                    const isModDone = modLessons.length > 0 && modDoneCount === modLessons.length;

                    return (
                      <div key={mod._id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">
                              Module {mod.order || modIdx + 1}: {mod.title}
                            </span>
                            {isModDone && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Done
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {modDoneCount}/{modLessons.length}
                            </span>
                            {!isModDone && (
                              <button
                                onClick={() => handleMarkModuleComplete(mod._id)}
                                disabled={completing}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                                title="Mark all lessons in this module complete"
                              >
                                Complete Module
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {modLessons.map((les, lesIdx) => {
                            const isCurrent = les._id?.toString() === lesson._id?.toString();
                            const lp = enrollmentLessonMap[les._id?.toString()];
                            const isLesCompleted = completedLessonIds.includes(les._id?.toString()) || lp?.status === 'COMPLETED';
                            const isLesInProgress = !isLesCompleted && (lp?.status === 'IN_PROGRESS' || (lp?.lastPositionSeconds > 0));
                            const lesPercentage = lp?.progressPercentage || 0;

                            return (
                              <Link
                                key={les._id}
                                to={`/learning/${courseId}/${les._id}`}
                                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 text-xs ${
                                  isCurrent
                                    ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-sm'
                                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                                }`}
                              >
                                <div className="shrink-0">
                                  {isLesCompleted ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                                      ✓
                                    </div>
                                  ) : isCurrent ? (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                                    </div>
                                  ) : isLesInProgress ? (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center justify-center text-[9px] font-bold">
                                      {lesPercentage}%
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                      {lesIdx + 1}
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="truncate font-medium">{les.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                    <span className="text-slate-400 font-normal">
                                      {les.duration || '15 min'}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    {isLesCompleted ? (
                                      <span className="font-semibold text-emerald-600">Completed</span>
                                    ) : isLesInProgress ? (
                                      <span className="font-semibold text-blue-600">In Progress ({lesPercentage}%)</span>
                                    ) : (
                                      <span className="text-slate-400">Not Started</span>
                                    )}
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                                    Now Playing
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No curriculum modules found.</p>
                )}
              </div>
            )}

            {/* TAB 2: SUPPORTED LESSON RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {resources.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No Attached Files</p>
                    <p className="text-[11px] text-slate-400">
                      All learning material is covered in the video lecture and reading notes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <ResourceCard key={resource._id} resource={resource} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Slide-out Curriculum Drawer ─── */}
      {mobileCurriculumOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Course Curriculum
                </h3>
                <button
                  onClick={() => setMobileCurriculumOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modules?.map((mod, modIdx) => {
                const modLessons = mod.lessons || [];
                const modDoneCount = modLessons.filter((l) =>
                  completedLessonIds.includes(l._id?.toString())
                ).length;
                const isModDone = modLessons.length > 0 && modDoneCount === modLessons.length;

                return (
                  <div key={mod._id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">
                          Module {mod.order || modIdx + 1}: {mod.title}
                        </span>
                        {isModDone && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {modDoneCount}/{modLessons.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {modLessons.map((les, lesIdx) => {
                        const isCurrent = les._id?.toString() === lesson._id?.toString();
                        const lp = enrollmentLessonMap[les._id?.toString()];
                        const isLesCompleted = completedLessonIds.includes(les._id?.toString()) || lp?.status === 'COMPLETED';
                        const isLesInProgress = !isLesCompleted && (lp?.status === 'IN_PROGRESS' || (lp?.lastPositionSeconds > 0));

                        return (
                          <Link
                            key={les._id}
                            to={`/learning/${courseId}/${les._id}`}
                            onClick={() => setMobileCurriculumOpen(false)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 text-xs ${
                              isCurrent
                                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 text-[10px] w-4 text-center">
                                {isLesCompleted ? '✓' : lesIdx + 1}
                              </span>
                              <span className="truncate">{les.title}</span>
                            </div>
                            {isLesCompleted ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                Done
                              </span>
                            ) : isLesInProgress ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                {lp?.progressPercentage || 0}%
                              </span>
                            ) : null}
                            <span className="shrink-0 text-[10px]">{isLesCompleted ? '✓' : lesIdx + 1}</span>
                            <span className="truncate flex-1">{les.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setMobileCurriculumOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs text-center"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lesson;