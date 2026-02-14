export type Role = "student" | "teacher";

export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  telegramId?: number;
  telegramUsername?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export type QuestionType = "single" | "multiple" | "short" | "numeric";

export interface QuestionOption {
  id: number;
  text: string;
}

export interface TeacherQuestion {
  id: number;
  prompt: string;
  type: QuestionType;
  points: number;
  options: QuestionOption[];
  correctOptionIds: number[];
  correctText: string | null;
  correctNumber: number | null;
  tolerance: number | null;
  explanation: string;
}

export interface TeacherQuestionInput {
  prompt: string;
  type: QuestionType;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
  correctText?: string | null;
  correctNumber?: number | null;
  tolerance?: number | null;
  explanation?: string;
}

export type TestStatus = "draft" | "published" | "archived";

export interface TeacherTest {
  id: number;
  title: string;
  description: string;
  status: TestStatus;
  timeLimitSec: number;
  passingPercent: number;
  courseId: number | null;
  questions: TeacherQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentQuestion {
  id: number;
  prompt: string;
  type: QuestionType;
  points: number;
  options: QuestionOption[];
}

export interface StudentTestSummary {
  id: number;
  title: string;
  description: string;
  questionCount: number;
  timeLimitSec: number;
  status: "open" | "completed";
}

export type AttemptStatus = "in_progress" | "submitted" | "expired";

export interface AttemptAnswerInput {
  questionId: number;
  selectedOptionIds?: number[];
  textAnswer?: string;
  numericAnswer?: number;
}

export interface StudentAttempt {
  id: number;
  testId: number;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
}

export interface StartAttemptResponse {
  attempt: StudentAttempt;
  test: {
    id: number;
    title: string;
    description: string;
    timeLimitSec: number;
    questions: StudentQuestion[];
  };
}

export interface QuestionResult {
  questionId: number;
  prompt: string;
  type: QuestionType;
  correct: boolean;
  pointsEarned: number;
  pointsMax: number;
  explanation: string;
  correctAnswerText: string;
  userAnswerText: string;
}

export interface AttemptResult {
  attemptId: number;
  testId: number;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  breakdown: QuestionResult[];
}

export interface TeacherResultRow {
  attemptId: number;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
}

export interface TeacherResultsSummary {
  testId: number;
  testTitle: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  rows: TeacherResultRow[];
}

export interface TeacherAttemptQuestionDetail {
  questionId: number;
  prompt: string;
  questionType: QuestionType;
  score: number;
  maxScore: number;
  writtenAnswer: string;
  selectedAnswers: QuestionOption[];
  correctAnswers: QuestionOption[];
}

export interface TeacherAttemptDetail {
  attemptId: number;
  testId: number;
  testTitle: string;
  studentId: number;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  startedAt: string;
  completedAt: string | null;
  questions: TeacherAttemptQuestionDetail[];
}

export interface Course {
  id: number;
  name: string;
}

export interface Enrollment {
  id: number;
  courseId: number;
  courseName: string;
  studentId: number;
  studentName: string;
}

export interface ApiErrorPayload {
  detail: string;
}

export interface TelegramWebApp {
  initData: string;
  colorScheme: "light" | "dark";
  themeParams: {
    bg_color?: string;
    text_color?: string;
    secondary_bg_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  ready: () => void;
  expand: () => void;
}

export interface AppToast {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}
