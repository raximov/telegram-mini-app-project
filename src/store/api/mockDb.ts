import type {
  AttemptAnswerInput,
  AttemptResult,
  AuthSession,
  Course,
  EnrollmentTestAssignment,
  Enrollment,
  QuestionOption,
  Role,
  StartAttemptResponse,
  StudentDirectoryItem,
  StudentAttempt,
  StudentQuestion,
  StudentTestSummary,
  TeacherQuestion,
  TeacherQuestionInput,
  TeacherAttemptDetail,
  TeacherResultsSummary,
  TeacherTest,
  TestStatus,
  UserProfile,
} from "@/types/domain";

interface SessionRecord {
  token: string;
  userId: number;
  role: Role;
  expiresAt: string;
}

interface StoredAttempt extends StudentAttempt {
  studentId: number;
  answers: AttemptAnswerInput[];
  result: AttemptResult | null;
}

const clone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const nowIso = (): string => new Date().toISOString();

const users: UserProfile[] = [
  {
    id: 101,
    username: "teacher.demo",
    firstName: "Nargiza",
    lastName: "Karimova",
    role: "teacher",
    telegramId: 77223311,
    telegramUsername: "teacher_demo",
  },
  {
    id: 201,
    username: "student.demo",
    firstName: "Aziz",
    lastName: "Tursunov",
    role: "student",
    telegramId: 99334411,
    telegramUsername: "student_demo",
  },
];

const courses: Course[] = [
  { id: 1, name: "Applied Physics" },
  { id: 2, name: "Mathematics" },
];

const enrollment: Enrollment[] = [
  {
    id: 1,
    studentId: 201,
    studentName: "Aziz Tursunov",
    courseId: 1,
    courseName: "Applied Physics",
  },
  {
    id: 2,
    studentId: 201,
    studentName: "Aziz Tursunov",
    courseId: 2,
    courseName: "Mathematics",
  },
];

let questionSequence = 5000;
let optionSequence = 9000;
let testSequence = 900;
let attemptSequence = 1200;
let courseSequence = 2;
let enrollmentSequence = 2;
let enrollmentTestSequence = 3;

const buildQuestion = (input: {
  prompt: string;
  type: TeacherQuestion["type"];
  points: number;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctText?: string;
  correctNumber?: number;
  tolerance?: number;
  explanation?: string;
}): TeacherQuestion => {
  const id = ++questionSequence;
  const options: QuestionOption[] = (input.options ?? []).map((option) => ({
    id: ++optionSequence,
    text: option.text,
  }));

  const correctOptionIds = (input.options ?? [])
    .map((option, index) => (option.isCorrect ? options[index]?.id : undefined))
    .filter((value): value is number => typeof value === "number");

  return {
    id,
    prompt: input.prompt,
    type: input.type,
    points: input.points,
    options,
    correctOptionIds,
    correctText: input.correctText ?? null,
    correctNumber: input.correctNumber ?? null,
    tolerance: input.tolerance ?? null,
    explanation: input.explanation ?? "",
  };
};

const initialTests: TeacherTest[] = [
  {
    id: 1,
    title: "Physics Core Quiz",
    description: "Motion, force, and units",
    status: "published",
    timeLimitSec: 900,
    passingPercent: 60,
    courseId: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    questions: [
      buildQuestion({
        prompt: "Which unit is used for force?",
        type: "single",
        points: 5,
        options: [
          { text: "Joule", isCorrect: false },
          { text: "Newton", isCorrect: true },
          { text: "Pascal", isCorrect: false },
          { text: "Watt", isCorrect: false },
        ],
        explanation: "Force is measured in Newtons (N).",
      }),
      buildQuestion({
        prompt: "Select all SI base quantities.",
        type: "multiple",
        points: 6,
        options: [
          { text: "Length", isCorrect: true },
          { text: "Mass", isCorrect: true },
          { text: "Velocity", isCorrect: false },
          { text: "Time", isCorrect: true },
        ],
        explanation: "Length, mass, and time are SI base quantities.",
      }),
      buildQuestion({
        prompt: "Write Newton's second law formula.",
        type: "short",
        points: 4,
        correctText: "F=ma",
        explanation: "Newton's second law is commonly written as F=ma.",
      }),
      buildQuestion({
        prompt: "Compute acceleration if force is 20N and mass is 4kg.",
        type: "numeric",
        points: 5,
        correctNumber: 5,
        tolerance: 0.01,
        explanation: "a = F/m = 20 / 4 = 5.",
      }),
    ],
  },
  {
    id: 2,
    title: "Algebra Speed Test",
    description: "Linear equations and simplification",
    status: "published",
    timeLimitSec: 600,
    passingPercent: 70,
    courseId: 2,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    questions: [
      buildQuestion({
        prompt: "Solve: 2x + 6 = 14",
        type: "numeric",
        points: 5,
        correctNumber: 4,
        tolerance: 0,
        explanation: "2x=8 so x=4.",
      }),
      buildQuestion({
        prompt: "Simplify: 3(a + b)",
        type: "single",
        points: 4,
        options: [
          { text: "3a + b", isCorrect: false },
          { text: "3a + 3b", isCorrect: true },
          { text: "a + 3b", isCorrect: false },
        ],
        explanation: "Distribute 3 to both terms.",
      }),
    ],
  },
  {
    id: 3,
    title: "Draft Geometry Test",
    description: "Teacher only draft",
    status: "draft",
    timeLimitSec: 1200,
    passingPercent: 60,
    courseId: 2,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    questions: [],
  },
];

const tests: TeacherTest[] = clone(initialTests);
const enrollmentTests: EnrollmentTestAssignment[] = tests
  .filter((test) => test.courseId !== null)
  .map((test) => ({
    id: ++enrollmentTestSequence,
    courseId: test.courseId as number,
    courseName: courses.find((course) => course.id === test.courseId)?.name ?? `Course ${test.courseId}`,
    testId: test.id,
    testTitle: test.title,
    attemptCount: 3,
    startDate: null,
    endDate: null,
  }));
const attempts: StoredAttempt[] = [];
const sessions = new Map<string, SessionRecord>();

const normalizeText = (value: string): string => value.replace(/\s+/g, "").toLowerCase();

const getUserById = (id: number): UserProfile | undefined => users.find((user) => user.id === id);
const getUserByRole = (role: Role): UserProfile => users.find((user) => user.role === role)!;

const issueSession = (role: Role): AuthSession => {
  const user = getUserByRole(role);
  const token = `${role}-${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  sessions.set(token, {
    token,
    userId: user.id,
    role,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    user: clone(user),
  };
};

export const loginMockUser = (payload: { username?: string; roleHint?: Role } = {}): AuthSession => {
  if (payload.roleHint) {
    return issueSession(payload.roleHint);
  }

  const username = payload.username?.toLowerCase() ?? "";
  const role: Role = username.includes("teach") ? "teacher" : "student";
  return issueSession(role);
};

export const logoutMockUser = (token: string | null): { success: true } => {
  if (token) {
    sessions.delete(token);
  }

  return { success: true };
};

export const resolveSession = (token: string | null): SessionRecord | null => {
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (Date.now() > new Date(session.expiresAt).getTime()) {
    sessions.delete(token);
    return null;
  }

  return session;
};

export const getProfile = (token: string | null): UserProfile => {
  const session = resolveSession(token);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const user = getUserById(session.userId);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return clone(user);
};

const asStudentQuestion = (question: TeacherQuestion): StudentQuestion => ({
  id: question.id,
  prompt: question.prompt,
  type: question.type,
  points: question.points,
  options: clone(question.options),
});

const getPublishedTests = (): TeacherTest[] => tests.filter((test) => test.status === "published");

export const listStudentTests = (token: string | null): StudentTestSummary[] => {
  const session = resolveSession(token);
  if (!session || session.role !== "student") {
    throw new Error("UNAUTHORIZED");
  }

  const studentCourseIds = enrollment
    .filter((item) => item.studentId === session.userId)
    .map((item) => item.courseId);
  const assignedTestIds = new Set(
    enrollmentTests
      .filter((item) => studentCourseIds.includes(item.courseId))
      .map((item) => item.testId)
  );

  return getPublishedTests()
    .filter((test) => assignedTestIds.has(test.id))
    .map((test) => {
    const hasSubmitted = attempts.some(
      (attempt) =>
        attempt.studentId === session.userId &&
        attempt.testId === test.id &&
        attempt.status === "submitted"
    );

    return {
      id: test.id,
      title: test.title,
      description: test.description,
      questionCount: test.questions.length,
      timeLimitSec: test.timeLimitSec,
      status: hasSubmitted ? "completed" : "open",
    };
  });
};

export const startStudentAttempt = (token: string | null, testId: number): StartAttemptResponse => {
  const session = resolveSession(token);
  if (!session || session.role !== "student") {
    throw new Error("UNAUTHORIZED");
  }

  const test = tests.find((item) => item.id === testId && item.status === "published");
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  const submittedAttempt = attempts.find(
    (attempt) =>
      attempt.studentId === session.userId && attempt.testId === testId && attempt.status === "submitted"
  );

  if (submittedAttempt) {
    throw new Error("TEST_ALREADY_COMPLETED");
  }

  const activeAttempt = attempts.find(
    (attempt) =>
      attempt.studentId === session.userId && attempt.testId === testId && attempt.status === "in_progress"
  );

  if (activeAttempt) {
    const isExpired = Date.now() > new Date(activeAttempt.expiresAt).getTime();
    if (isExpired) {
      activeAttempt.status = "expired";
    } else {
      return {
        attempt: clone(activeAttempt),
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          timeLimitSec: test.timeLimitSec,
          questions: test.questions.map(asStudentQuestion),
        },
      };
    }
  }

  const startedAt = new Date();
  const attempt: StoredAttempt = {
    id: ++attemptSequence,
    testId: test.id,
    studentId: session.userId,
    status: "in_progress",
    startedAt: startedAt.toISOString(),
    expiresAt: new Date(startedAt.getTime() + test.timeLimitSec * 1000).toISOString(),
    submittedAt: null,
    answers: [],
    result: null,
  };

  attempts.push(attempt);

  return {
    attempt: clone(attempt),
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimitSec: test.timeLimitSec,
      questions: test.questions.map(asStudentQuestion),
    },
  };
};

const compareNumber = (expected: number, received: number, tolerance: number): boolean => {
  return Math.abs(expected - received) <= tolerance;
};

const formatCorrectAnswer = (question: TeacherQuestion): string => {
  if (question.type === "short") {
    return question.correctText ?? "";
  }

  if (question.type === "numeric") {
    return question.correctNumber === null ? "" : String(question.correctNumber);
  }

  if (question.type === "single" || question.type === "multiple") {
    const map = new Map(question.options.map((option) => [option.id, option.text]));
    return question.correctOptionIds.map((id) => map.get(id) ?? "").filter(Boolean).join(", ");
  }

  return "";
};

const formatUserAnswer = (question: TeacherQuestion, answer: AttemptAnswerInput | undefined): string => {
  if (!answer) {
    return "No answer";
  }

  if (question.type === "short") {
    return answer.textAnswer?.trim() || "No answer";
  }

  if (question.type === "numeric") {
    return typeof answer.numericAnswer === "number" ? String(answer.numericAnswer) : "No answer";
  }

  const map = new Map(question.options.map((option) => [option.id, option.text]));
  return (answer.selectedOptionIds ?? []).map((id) => map.get(id) ?? "").filter(Boolean).join(", ") || "No answer";
};

const scoreAttempt = (attempt: StoredAttempt, test: TeacherTest): AttemptResult => {
  let score = 0;
  let maxScore = 0;

  const breakdown = test.questions.map((question) => {
    maxScore += question.points;

    const answer = attempt.answers.find((item) => item.questionId === question.id);
    let correct = false;

    if (question.type === "single") {
      const selected = answer?.selectedOptionIds ?? [];
      correct = selected.length === 1 && selected[0] === question.correctOptionIds[0];
    }

    if (question.type === "multiple") {
      const selected = [...(answer?.selectedOptionIds ?? [])].sort((a, b) => a - b);
      const expected = [...question.correctOptionIds].sort((a, b) => a - b);
      correct = selected.length === expected.length && selected.every((value, index) => value === expected[index]);
    }

    if (question.type === "short") {
      correct = normalizeText(answer?.textAnswer ?? "") === normalizeText(question.correctText ?? "");
    }

    if (question.type === "numeric") {
      if (typeof answer?.numericAnswer === "number" && typeof question.correctNumber === "number") {
        correct = compareNumber(
          question.correctNumber,
          answer.numericAnswer,
          question.tolerance ?? 0
        );
      }
    }

    const pointsEarned = correct ? question.points : 0;
    score += pointsEarned;

    return {
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      correct,
      pointsEarned,
      pointsMax: question.points,
      explanation: question.explanation,
      correctAnswerText: formatCorrectAnswer(question),
      userAnswerText: formatUserAnswer(question, answer),
    };
  });

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    attemptId: attempt.id,
    testId: test.id,
    testTitle: test.title,
    score,
    maxScore,
    percentage,
    passed: percentage >= test.passingPercent,
    submittedAt: attempt.submittedAt ?? nowIso(),
    breakdown,
  };
};

export const submitStudentAttempt = (
  token: string | null,
  attemptId: number,
  incomingAnswers: AttemptAnswerInput[]
): AttemptResult => {
  const session = resolveSession(token);
  if (!session || session.role !== "student") {
    throw new Error("UNAUTHORIZED");
  }

  const attempt = attempts.find((item) => item.id === attemptId && item.studentId === session.userId);
  if (!attempt) {
    throw new Error("NOT_FOUND");
  }

  if (attempt.status === "submitted") {
    throw new Error("ATTEMPT_ALREADY_SUBMITTED");
  }

  const expired = Date.now() > new Date(attempt.expiresAt).getTime();
  if (expired) {
    attempt.status = "expired";
    throw new Error("ATTEMPT_EXPIRED");
  }

  const test = tests.find((item) => item.id === attempt.testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  attempt.answers = clone(incomingAnswers);
  attempt.status = "submitted";
  attempt.submittedAt = nowIso();
  attempt.result = scoreAttempt(attempt, test);
  return clone(attempt.result);
};

export const getStudentAttemptResult = (token: string | null, attemptId: number): AttemptResult => {
  const session = resolveSession(token);
  if (!session || session.role !== "student") {
    throw new Error("UNAUTHORIZED");
  }

  const attempt = attempts.find((item) => item.id === attemptId && item.studentId === session.userId);
  if (!attempt) {
    throw new Error("NOT_FOUND");
  }

  if (!attempt.result || attempt.status !== "submitted") {
    throw new Error("RESULT_NOT_READY");
  }

  return clone(attempt.result);
};

export const listTeacherTests = (token: string | null): TeacherTest[] => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  return clone(tests);
};

export const getTeacherTest = (token: string | null, testId: number): TeacherTest => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const test = tests.find((item) => item.id === testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  return clone(test);
};

const normalizeStatus = (status: unknown): TestStatus => {
  if (status === "published" || status === "draft" || status === "archived") {
    return status;
  }

  return "draft";
};

export const createTeacherTest = (token: string | null, payload: Partial<TeacherTest>): TeacherTest => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const timestamp = nowIso();
  const test: TeacherTest = {
    id: ++testSequence,
    title: payload.title ?? "Untitled Test",
    description: payload.description ?? "",
    status: normalizeStatus(payload.status),
    timeLimitSec: payload.timeLimitSec ?? 900,
    passingPercent: payload.passingPercent ?? 60,
    courseId: payload.courseId ?? null,
    questions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  tests.push(test);
  return clone(test);
};

export const updateTeacherTest = (
  token: string | null,
  testId: number,
  payload: Partial<TeacherTest>
): TeacherTest => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const test = tests.find((item) => item.id === testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  test.title = payload.title ?? test.title;
  test.description = payload.description ?? test.description;
  test.status = payload.status ? normalizeStatus(payload.status) : test.status;
  test.timeLimitSec = payload.timeLimitSec ?? test.timeLimitSec;
  test.passingPercent = payload.passingPercent ?? test.passingPercent;
  test.courseId = payload.courseId ?? test.courseId;
  test.updatedAt = nowIso();

  return clone(test);
};

export const deleteTeacherTest = (token: string | null, testId: number): { success: true } => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const index = tests.findIndex((item) => item.id === testId);
  if (index === -1) {
    throw new Error("NOT_FOUND");
  }

  tests.splice(index, 1);

  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    if (attempts[i]?.testId === testId) {
      attempts.splice(i, 1);
    }
  }

  return { success: true };
};

const buildTeacherQuestionFromInput = (input: TeacherQuestionInput): TeacherQuestion => {
  return buildQuestion({
    prompt: input.prompt,
    type: input.type,
    points: input.points,
    options: input.options,
    correctText: input.correctText ?? undefined,
    correctNumber: input.correctNumber ?? undefined,
    tolerance: input.tolerance ?? undefined,
    explanation: input.explanation,
  });
};

export const createTeacherQuestion = (
  token: string | null,
  testId: number,
  payload: TeacherQuestionInput
): TeacherQuestion => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const test = tests.find((item) => item.id === testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  const question = buildTeacherQuestionFromInput(payload);
  test.questions.push(question);
  test.updatedAt = nowIso();

  return clone(question);
};

export const updateTeacherQuestion = (
  token: string | null,
  questionId: number,
  payload: TeacherQuestionInput
): TeacherQuestion => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  for (const test of tests) {
    const index = test.questions.findIndex((question) => question.id === questionId);
    if (index === -1) {
      continue;
    }

    const updated = buildTeacherQuestionFromInput(payload);
    updated.id = questionId;
    test.questions[index] = updated;
    test.updatedAt = nowIso();
    return clone(updated);
  }

  throw new Error("NOT_FOUND");
};

export const deleteTeacherQuestion = (token: string | null, questionId: number): { success: true } => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  for (const test of tests) {
    const index = test.questions.findIndex((question) => question.id === questionId);
    if (index === -1) {
      continue;
    }

    test.questions.splice(index, 1);
    test.updatedAt = nowIso();
    return { success: true };
  }

  throw new Error("NOT_FOUND");
};

export const getTeacherResults = (token: string | null, testId: number): TeacherResultsSummary => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const test = tests.find((item) => item.id === testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  const submitted = attempts.filter((attempt) => attempt.testId === testId && attempt.status === "submitted" && attempt.result);

  const rows = submitted.map((attempt) => {
    const student = getUserById(attempt.studentId);
    const result = attempt.result!;

    return {
      attemptId: attempt.id,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
      submittedAt: result.submittedAt,
    };
  });

  const totalAttempts = rows.length;
  const totalScore = rows.reduce((sum, row) => sum + row.percentage, 0);
  const passedCount = rows.filter((row) => row.passed).length;

  return {
    testId: test.id,
    testTitle: test.title,
    totalAttempts,
    averageScore: totalAttempts > 0 ? totalScore / totalAttempts : 0,
    passRate: totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0,
    rows,
  };
};

export const getTeacherAttemptDetails = (token: string | null, attemptId: number): TeacherAttemptDetail => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) {
    throw new Error("NOT_FOUND");
  }

  const test = tests.find((item) => item.id === attempt.testId);
  if (!test) {
    throw new Error("NOT_FOUND");
  }

  const student = getUserById(attempt.studentId);
  const answersByQuestionId = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

  return {
    attemptId: attempt.id,
    testId: test.id,
    testTitle: test.title,
    studentId: attempt.studentId,
    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
    score: attempt.result?.score ?? 0,
    maxScore: attempt.result?.maxScore ?? test.questions.reduce((sum, question) => sum + question.points, 0),
    percentage: attempt.result?.percentage ?? 0,
    startedAt: attempt.startedAt,
    completedAt: attempt.submittedAt,
    questions: test.questions.map((question) => {
      const answer = answersByQuestionId.get(question.id);
      const selectedOptionIds = answer?.selectedOptionIds ?? [];
      const selectedAnswers = question.options.filter((option) => selectedOptionIds.includes(option.id));
      const correctAnswers =
        question.type === "single" || question.type === "multiple"
          ? question.options.filter((option) => question.correctOptionIds.includes(option.id))
          : [];
      const writtenAnswer =
        question.type === "numeric"
          ? typeof answer?.numericAnswer === "number"
            ? String(answer.numericAnswer)
            : ""
          : answer?.textAnswer ?? "";

      const scoredMark =
        attempt.result?.breakdown.find((row) => row.questionId === question.id)?.pointsEarned ?? 0;

      return {
        questionId: question.id,
        prompt: question.prompt,
        questionType: question.type,
        score: scoredMark,
        maxScore: question.points,
        writtenAnswer,
        selectedAnswers,
        correctAnswers,
      };
    }),
  };
};

export const listCourses = (token: string | null): Course[] => {
  const session = resolveSession(token);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return clone(courses);
};

export const listEnrollment = (token: string | null): Enrollment[] => {
  const session = resolveSession(token);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return clone(enrollment);
};

export const listStudents = (token: string | null): StudentDirectoryItem[] => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  return clone(
    users
      .filter((user) => user.role === "student")
      .map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
      }))
  );
};

export const createCourse = (token: string | null, payload: { title?: string }): Course => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const title = payload.title?.trim() || "New Course";

  const course: Course = {
    id: ++courseSequence,
    name: title,
  };
  courses.push(course);
  return clone(course);
};

export const createEnrollment = (
  token: string | null,
  payload: { student?: number; course?: number }
): Enrollment => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const studentId = Number(payload.student);
  const courseId = Number(payload.course);

  const student = users.find((user) => user.id === studentId && user.role === "student");
  const course = courses.find((item) => item.id === courseId);
  if (!student || !course) {
    throw new Error("NOT_FOUND");
  }

  const existing = enrollment.find((item) => item.studentId === studentId && item.courseId === courseId);
  if (existing) {
    return clone(existing);
  }

  const created: Enrollment = {
    id: ++enrollmentSequence,
    studentId,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    courseId,
    courseName: course.name,
  };
  enrollment.push(created);
  return clone(created);
};

export const listEnrollmentTests = (token: string | null): EnrollmentTestAssignment[] => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  return clone(enrollmentTests);
};

export const createEnrollmentTest = (
  token: string | null,
  payload: { course_id?: number; test_id?: number; attempt_count?: number }
): EnrollmentTestAssignment => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const courseId = Number(payload.course_id);
  const testId = Number(payload.test_id);
  const attemptCount = Number(payload.attempt_count ?? 3);

  const course = courses.find((item) => item.id === courseId);
  const test = tests.find((item) => item.id === testId);
  if (!course || !test) {
    throw new Error("NOT_FOUND");
  }

  const existing = enrollmentTests.find((item) => item.courseId === courseId && item.testId === testId);
  if (existing) {
    return clone(existing);
  }

  const assignment: EnrollmentTestAssignment = {
    id: ++enrollmentTestSequence,
    courseId,
    courseName: course.name,
    testId,
    testTitle: test.title,
    attemptCount: Number.isFinite(attemptCount) && attemptCount > 0 ? attemptCount : 3,
    startDate: null,
    endDate: null,
  };
  enrollmentTests.push(assignment);
  return clone(assignment);
};

export const deleteEnrollmentTest = (token: string | null, assignmentId: number): { success: true } => {
  const session = resolveSession(token);
  if (!session || session.role !== "teacher") {
    throw new Error("UNAUTHORIZED");
  }

  const index = enrollmentTests.findIndex((item) => item.id === assignmentId);
  if (index === -1) {
    throw new Error("NOT_FOUND");
  }

  enrollmentTests.splice(index, 1);
  return { success: true };
};
