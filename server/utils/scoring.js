/**
 * Pure scoring function for quiz attempts (SCRUM-49).
 * Evaluates submitted answers against quiz questions strictly on the server.
 *
 * Rules:
 * - MCQ single and true/false: correct only if the selected option index matches.
 * - MCQ multiple: all-or-nothing, full points only if the selected set exactly equals the correct set.
 * - Short answer: trim, ignore case, collapse extra spaces, compare to accepted answers.
 * - Unanswered scores 0.
 * - Snapshots points and correct answers at submission time so later quiz edits do not alter historical records.
 *
 * @param {Object} quiz - Quiz document containing questions, passingScore, etc.
 * @param {Array} submittedAnswers - Array of { questionId, selectedOptions, textAnswer }
 * @returns {Object} { answers, score, maxScore, percentage, passed }
 */
export function scoreAttempt(quiz, submittedAnswers = []) {
  const safeSubmitted = Array.isArray(submittedAnswers) ? submittedAnswers : [];
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  let totalPointsAwarded = 0;
  let totalMaxPoints = 0;

  const evaluatedAnswers = questions.map((question) => {
    const qIdStr = question._id?.toString();
    const maxPoints = typeof question.points === 'number' && question.points > 0 ? question.points : 1;
    totalMaxPoints += maxPoints;

    const submission = safeSubmitted.find(
      (sub) => (sub.questionId || sub.question)?.toString() === qIdStr
    );

    const qType = question.type || 'single_choice';
    let isCorrect = false;
    let selectedOptions = [];
    let textAnswer = '';
    let correctAnswersSnapshot = [];

    if (qType === 'single_choice') {
      correctAnswersSnapshot = [question.correctOptionIndex];
      if (submission) {
        if (typeof submission.selectedOptionIndex === 'number') {
          selectedOptions = [submission.selectedOptionIndex];
        } else if (Array.isArray(submission.selectedOptions) && submission.selectedOptions.length > 0) {
          selectedOptions = [Number(submission.selectedOptions[0])];
        }
      }
      isCorrect =
        selectedOptions.length > 0 &&
        selectedOptions[0] === question.correctOptionIndex;
    } else if (qType === 'multiple_choice') {
      /**
       * MCQ Multiple Choice Scoring Rule:
       * All-or-nothing: full points awarded only if the user's selected set of options
       * exactly equals the correct set of options. Any extra or missing option yields 0 points.
       */
      const correctSet = Array.isArray(question.correctOptions)
        ? [...question.correctOptions].map(Number).sort((a, b) => a - b)
        : [];
      correctAnswersSnapshot = correctSet;

      if (submission && Array.isArray(submission.selectedOptions)) {
        selectedOptions = Array.from(new Set(submission.selectedOptions.map(Number))).sort((a, b) => a - b);
      }

      isCorrect =
        selectedOptions.length > 0 &&
        selectedOptions.length === correctSet.length &&
        selectedOptions.every((val, idx) => val === correctSet[idx]);
    } else if (qType === 'true_false') {
      const correctIndex = typeof question.correctOptionIndex === 'number'
        ? question.correctOptionIndex
        : question.correctBoolean ? 0 : 1;
      correctAnswersSnapshot = [correctIndex];

      if (submission) {
        if (typeof submission.selectedOptionIndex === 'number') {
          selectedOptions = [submission.selectedOptionIndex];
        } else if (typeof submission.selectedBoolean === 'boolean') {
          selectedOptions = [submission.selectedBoolean ? 0 : 1];
        } else if (Array.isArray(submission.selectedOptions) && submission.selectedOptions.length > 0) {
          selectedOptions = [Number(submission.selectedOptions[0])];
        }
      }

      isCorrect = selectedOptions.length > 0 && selectedOptions[0] === correctIndex;
    } else if (qType === 'short_answer') {
      correctAnswersSnapshot = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
      if (submission && typeof submission.textAnswer === 'string') {
        textAnswer = submission.textAnswer;
      }

      // Normalized comparison: trim, lower case, collapse multiple consecutive spaces
      const normalizedSubmission = textAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedAccepted = correctAnswersSnapshot.map((ans) =>
        String(ans).trim().toLowerCase().replace(/\s+/g, ' ')
      );

      isCorrect =
        normalizedSubmission.length > 0 &&
        normalizedAccepted.includes(normalizedSubmission);
    }

    const pointsAwarded = isCorrect ? maxPoints : 0;
    totalPointsAwarded += pointsAwarded;

    return {
      question: question._id,
      questionText: question.questionText || '',
      type: qType,
      options: question.options || [],
      selectedOptions,
      textAnswer,
      isCorrect,
      pointsAwarded,
      maxPoints,
      correctAnswers: correctAnswersSnapshot,
      explanation: question.explanation || '',
    };
  });

  const percentage = totalMaxPoints > 0 ? Math.round((totalPointsAwarded / totalMaxPoints) * 100) : 0;
  const passingScore = typeof quiz?.passingScore === 'number' ? quiz.passingScore : 50;
  const passed = percentage >= passingScore;

  return {
    answers: evaluatedAnswers,
    score: totalPointsAwarded,
    maxScore: totalMaxPoints,
    percentage,
    passed,
  };
}

/**
 * At-Risk student calculation rule (Part 5 config constant):
 * Rule: progress below 30%, or no activity for 7 days, or quiz average below 50%.
 */
export const AT_RISK_THRESHOLDS = {
  MIN_PROGRESS_PCT: 30,
  MAX_INACTIVE_DAYS: 7,
  MIN_QUIZ_AVG_PCT: 50,
};

export function isStudentAtRisk({ progress = 0, lastActivityDate = null, quizAverage = null }) {
  if (progress < AT_RISK_THRESHOLDS.MIN_PROGRESS_PCT) {
    return { atRisk: true, reason: 'Course progress is below 30%' };
  }

  if (lastActivityDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > AT_RISK_THRESHOLDS.MAX_INACTIVE_DAYS) {
      return { atRisk: true, reason: `No learning activity for ${daysSince} days (> 7 days)` };
    }
  }

  if (typeof quizAverage === 'number' && quizAverage >= 0 && quizAverage < AT_RISK_THRESHOLDS.MIN_QUIZ_AVG_PCT) {
    return { atRisk: true, reason: `Quiz average (${quizAverage}%) is below 50%` };
  }

  return { atRisk: false, reason: null };
}
