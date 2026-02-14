/**
 * API Configuration
 * Centralized API configuration for the Telegram Mini App
 */

// API Base URL - should be configured via environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    TOKEN: '/api-token-auth/',
    LOGIN: '/school/login/',
    LOGOUT: '/school/logout/',
    PROFILE: '/school/profile/',
    TELEGRAM_AUTH: '/school/telegram-auth/', // Assuming this endpoint exists
  },

  // Student endpoints
  STUDENT: {
    TESTS: '/testapp/api/v1/student/tests/',
    START_TEST: (testId: number) => `/testapp/api/v1/student/tests/${testId}/start/`,
    SUBMIT_ATTEMPT: (attemptId: number) => `/testapp/api/v1/student/attempts/${attemptId}/submit/`,
    ATTEMPT_RESULT: (attemptId: number) => `/testapp/api/v1/student/attempts/${attemptId}/result/`,
    TEST_RESULT: (testId: number) => `/testapp/student/test/${testId}/result/`,
    TASKS: '/school/student/tasks/',
    TASK_DETAIL: (taskId: number) => `/school/student/tasks/${taskId}/`,
    SUBMISSIONS: '/school/student/submit/',
    SUBMISSION_DETAIL: (submissionId: number) => `/school/student/submit/${submissionId}/`,
  },

  // Teacher endpoints
  TEACHER: {
    TESTS: '/testapp/teacher/tests/',
    TEST_DETAIL: (testId: number) => `/testapp/teacher/tests/${testId}/`,
    QUESTIONS: '/testapp/teacher/questions/',
    QUESTION_DETAIL: (questionId: number) => `/testapp/teacher/questions/${questionId}/`,
    ANSWERS: '/testapp/teacher/answers/',
    ANSWER_DETAIL: (answerId: number) => `/testapp/teacher/answers/${answerId}/`,
    TEST_RESULTS: (testId: number) => `/testapp/teacher/tests/${testId}/results/`,
    RESULTS: (testId: number) => `/testapp/teacher/test/${testId}/results/`,
    TASKS: '/school/teacher/tasks/',
    TASK_DETAIL: (taskId: number) => `/school/teacher/tasks/${taskId}/`,
    SUBMISSIONS: '/school/teacher/submit/',
    SUBMISSION_DETAIL: (submissionId: number) => `/school/teacher/submit/${submissionId}/`,
    COURSE_STATS: '/school/teacher/course-stats/',
    COURSE_STATS_DETAIL: (courseId: number) => `/school/teacher/course-stats/${courseId}/`,
    TASK_STATS: (taskId: number) => `/school/teacher/task-stats/${taskId}/`,
  },

  // School module
  SCHOOL: {
    COURSES: '/school/courses/',
    COURSE_DETAIL: (courseId: number) => `/school/courses/${courseId}/`,
    ENROLLMENT: '/school/enrollment/',
    ENROLLMENT_DETAIL: (enrollmentId: number) => `/school/enrollment/${enrollmentId}/`,
    STUDENTS: '/school/students/',
    STUDENT_DETAIL: (studentId: number) => `/school/students/${studentId}/`,
    TEACHERS: '/school/teacher/',
  },

  // Nazorat module
  NAZORAT: {
    LIST: '/nazorat/nazorats/',
    DETAIL: (id: number) => `/nazorat/nazorats/${id}/`,
    CALCULATE_SCORES: (id: number) => `/nazorat/nazorats/${id}/calculate_scores/`,
    RESULTS: '/nazorat/nazorat-result/',
    RESULTS_LIST: '/nazorat/nazorat-result-list/',
    RESULT_DETAIL: (id: number) => `/nazorat/nazorat-result/${id}/`,
  },

  // Enrollment tests
  ENROLLMENT_TESTS: {
    LIST: '/testapp/enrollment-tests/',
    DETAIL: (id: number) => `/testapp/enrollment-tests/${id}/`,
    TEACHER_LIST: '/testapp/teacher/enrollment-tests/',
    TEACHER_DETAIL: (id: number) => `/testapp/teacher/enrollment-tests/${id}/`,
  },
} as const;

// Request configuration
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tg_mini_app_auth_token',
  TOKEN_EXPIRY: 'tg_mini_app_token_expiry',
  USER_ROLE: 'tg_mini_app_user_role',
  USER_DATA: 'tg_mini_app_user_data',
  THEME: 'tg_mini_app_theme',
  CACHE_PREFIX: 'tg_mini_app_cache_',
} as const;

// Token refresh threshold (5 minutes before expiry)
export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// Cache duration (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;
