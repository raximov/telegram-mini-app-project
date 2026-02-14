/**
 * Telegram Mini App - Type Definitions
 * Comprehensive type definitions for the entire application
 */

// ============================================
// Telegram WebApp Types
// ============================================

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    query_id?: string;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  close: () => void;
  expand: () => void;
  ready: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthToken {
  token: string;
  user_id: number;
  username?: string;
  role?: 'student' | 'teacher';
}

export interface TelegramAuthRequest {
  initData: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiry: number | null;
}

// ============================================
// User Types
// ============================================

export type Gender = 'M' | 'F' | 'O';
export type Country = 'UZ' | 'RU' | 'KZ' | 'KG' | 'TJ' | 'TM' | 'OTHER';
export type SourceType = 'WEBSITE' | 'TELEGRAM' | 'MOBILE_APP' | 'REFERRAL';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  telegram_id?: number;
  telegram_username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Student extends User {
  role: 'student';
  enrollment_date?: string;
  courses: Course[];
  submissions: StudentSubmission[];
}

export interface Teacher extends User {
  role: 'teacher';
  department?: string;
  courses: Course[];
  tasks: Task[];
}

export interface UserState {
  user: Student | Teacher | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserProfile {
  id: number;
  user: number;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
}

// ============================================
// Course & Enrollment Types
// ============================================

export interface Course {
  id: number;
  name: string;
  description: string;
  teacher: number;
  teacher_name?: string;
  students?: Student[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Enrollment {
  id: number;
  student: number;
  student_name?: string;
  course: number;
  course_name?: string;
  enrolled_at: string;
  is_active: boolean;
}

// ============================================
// Test Types
// ============================================

export type QuestionType = 'SINGLE' | 'MULTIPLE' | 'SHORT' | 'CALCULATION';
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';

export interface Test {
  id: number;
  title: string;
  description?: string;
  course?: number;
  course_name?: string;
  teacher: number;
  teacher_name?: string;
  questions: Question[];
  total_points: number;
  time_limit?: number; // in minutes
  max_attempts?: number;
  passing_score?: number;
  status: TestStatus;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  test: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  order: number;
  image_url?: string;
  hint?: string;
  explanation?: string;
  answers: Answer[];
  tolerance?: number; // for calculation questions
  correct_answer?: string; // for short answer
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: number;
  question: number;
  answer_text: string;
  is_correct: boolean;
  order: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TestState {
  tests: Test[];
  currentTest: Test | null;
  isLoading: boolean;
  error: string | null;
  filters: TestFilters;
}

export interface TestFilters {
  status?: TestStatus;
  course?: number;
  search?: string;
}

// ============================================
// Attempt Types
// ============================================

export interface Attempt {
  id: number;
  test: number;
  test_title?: string;
  student: number;
  student_name?: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at?: string;
  expires_at?: string;
  time_spent?: number; // in seconds
  score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  answers: AttemptAnswer[];
  created_at: string;
  updated_at: string;
}

export interface AttemptAnswer {
  id: number;
  attempt: number;
  question: number;
  question_text?: string;
  question_type?: QuestionType;
  selected_answers: number[];
  text_answer?: string;
  numeric_answer?: number;
  is_correct?: boolean;
  points_earned?: number;
  max_points?: number;
  feedback?: string;
}

export interface AttemptState {
  currentAttempt: Attempt | null;
  attempts: Attempt[];
  answers: Record<number, AttemptAnswer>;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number | null;
}

export interface SubmitAnswerRequest {
  question_id: number;
  selected_answers?: number[];
  text_answer?: string;
  numeric_answer?: number;
}

// ============================================
// Result Types
// ============================================

export interface TestResult {
  attempt: Attempt;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  time_spent: number;
  detailed_results: QuestionResult[];
}

export interface QuestionResult {
  question: Question;
  user_answer: AttemptAnswer;
  is_correct: boolean;
  points_earned: number;
  explanation?: string;
}

export interface AggregatedResult {
  test_id: number;
  test_title: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  average_time_spent: number;
  question_stats: QuestionStats[];
}

export interface QuestionStats {
  question_id: number;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  accuracy_rate: number;
}

// ============================================
// Task Types
// ============================================

export interface Task {
  id: number;
  title: string;
  description?: string;
  course?: number;
  course_name?: string;
  teacher: number;
  teacher_name?: string;
  due_date?: string;
  max_score?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentSubmission {
  id: number;
  task: number;
  task_title?: string;
  student: number;
  student_name?: string;
  content: string;
  file_url?: string;
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  graded_by?: number;
}

export interface TeacherSubmission {
  id: number;
  task: number;
  student: number;
  student_name?: string;
  content: string;
  file_url?: string;
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
}

// ============================================
// Nazorat (Exam) Types
// ============================================

export interface Nazorat {
  id: number;
  title: string;
  description?: string;
  course?: number;
  teacher: number;
  max_score: number;
  created_at: string;
  updated_at: string;
}

export interface NazoratResult {
  id: number;
  nazorat: number;
  nazorat_title?: string;
  student: number;
  student_name?: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  feedback?: string;
  created_at: string;
}

// ============================================
// UI Types
// ============================================

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  isOnline: boolean;
  sidebarOpen: boolean;
  modals: {
    confirmModal: {
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    };
  };
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ============================================
// Component Props Types
// ============================================

export interface QuestionRendererProps {
  question: Question;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export interface TestCardProps {
  test: Test;
  onStart?: () => void;
  onViewResults?: () => void;
  userRole: 'student' | 'teacher';
}

export interface ResultCardProps {
  result: TestResult | Attempt;
  onViewDetails?: () => void;
}

// ============================================
// Store Types
// ============================================

export interface RootState {
  auth: AuthState;
  user: UserState;
  test: TestState;
  attempt: AttemptState;
  ui: UIState;
}
