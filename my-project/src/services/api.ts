/**
 * API Services
 * Service layer for all API interactions
 */

import { api, getAuthToken, setAuthToken, clearAuth, secureStorage } from '@/lib/api-client';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/api-config';
import {
  AuthToken,
  User,
  Student,
  Teacher,
  Test,
  Question,
  Answer,
  Attempt,
  TestResult,
  SubmitAnswerRequest,
  Course,
  Enrollment,
  Task,
  StudentSubmission,
  TeacherSubmission,
  Nazorat,
  NazoratResult,
  PaginatedResponse,
  TelegramAuthRequest,
} from '@/types';

// ============================================
// Authentication Service
// ============================================

export const authService = {
  /**
   * Authenticate with Telegram initData
   */
  loginWithTelegram: async (initData: string): Promise<AuthToken> => {
    const response = await api.post<AuthToken>(API_ENDPOINTS.AUTH.TELEGRAM_AUTH, {
      initData,
    } as TelegramAuthRequest);
    
    // Store token
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours default
    setAuthToken(response.token, expiry);
    
    // Store user role
    if (response.role) {
      secureStorage.set(STORAGE_KEYS.USER_ROLE, response.role);
    }
    
    return response;
  },

  /**
   * Traditional token authentication
   */
  login: async (username: string, password: string): Promise<AuthToken> => {
    const response = await api.post<AuthToken>(API_ENDPOINTS.AUTH.TOKEN, {
      username,
      password,
    });
    
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    setAuthToken(response.token, expiry);
    
    if (response.role) {
      secureStorage.set(STORAGE_KEYS.USER_ROLE, response.role);
    }
    
    return response;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      clearAuth();
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<Student | Teacher> => {
    const response = await api.get<Student | Teacher>(API_ENDPOINTS.AUTH.PROFILE);
    secureStorage.setJson(STORAGE_KEYS.USER_DATA, response);
    return response;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return getAuthToken() !== null;
  },

  /**
   * Get stored user role
   */
  getUserRole: (): 'student' | 'teacher' | null => {
    const role = secureStorage.get(STORAGE_KEYS.USER_ROLE);
    if (role === 'student' || role === 'teacher') {
      return role;
    }
    return null;
  },
};

// ============================================
// Student Service
// ============================================

export const studentService = {
  /**
   * Get available tests for student
   */
  getTests: async (params?: { course?: number; status?: string }): Promise<Test[]> => {
    return api.get<Test[]>(API_ENDPOINTS.STUDENT.TESTS, { params });
  },

  /**
   * Start a test - creates an attempt
   */
  startTest: async (testId: number): Promise<Attempt> => {
    return api.post<Attempt>(API_ENDPOINTS.STUDENT.START_TEST(testId));
  },

  /**
   * Submit answer for a question
   */
  submitAnswer: async (attemptId: number, answer: SubmitAnswerRequest): Promise<Attempt> => {
    return api.post<Attempt>(API_ENDPOINTS.STUDENT.SUBMIT_ATTEMPT(attemptId), answer);
  },

  /**
   * Submit entire attempt
   */
  submitAttempt: async (attemptId: number): Promise<TestResult> => {
    return api.post<TestResult>(API_ENDPOINTS.STUDENT.SUBMIT_ATTEMPT(attemptId));
  },

  /**
   * Get attempt result
   */
  getAttemptResult: async (attemptId: number): Promise<TestResult> => {
    return api.get<TestResult>(API_ENDPOINTS.STUDENT.ATTEMPT_RESULT(attemptId));
  },

  /**
   * Get test result
   */
  getTestResult: async (testId: number): Promise<TestResult> => {
    return api.get<TestResult>(API_ENDPOINTS.STUDENT.TEST_RESULT(testId));
  },

  /**
   * Get student tasks
   */
  getTasks: async (): Promise<Task[]> => {
    return api.get<Task[]>(API_ENDPOINTS.STUDENT.TASKS);
  },

  /**
   * Get task detail
   */
  getTaskDetail: async (taskId: number): Promise<Task> => {
    return api.get<Task>(API_ENDPOINTS.STUDENT.TASK_DETAIL(taskId));
  },

  /**
   * Get submissions
   */
  getSubmissions: async (): Promise<StudentSubmission[]> => {
    return api.get<StudentSubmission[]>(API_ENDPOINTS.STUDENT.SUBMISSIONS);
  },

  /**
   * Submit task
   */
  submitTask: async (submissionId: number, data: Partial<StudentSubmission>): Promise<StudentSubmission> => {
    return api.post<StudentSubmission>(API_ENDPOINTS.STUDENT.SUBMISSION_DETAIL(submissionId), data);
  },
};

// ============================================
// Teacher Service
// ============================================

export const teacherService = {
  // Tests
  /**
   * Get teacher's tests
   */
  getTests: async (): Promise<Test[]> => {
    return api.get<Test[]>(API_ENDPOINTS.TEACHER.TESTS);
  },

  /**
   * Get test detail
   */
  getTest: async (testId: number): Promise<Test> => {
    return api.get<Test>(API_ENDPOINTS.TEACHER.TEST_DETAIL(testId));
  },

  /**
   * Create test
   */
  createTest: async (data: Partial<Test>): Promise<Test> => {
    return api.post<Test>(API_ENDPOINTS.TEACHER.TESTS, data);
  },

  /**
   * Update test
   */
  updateTest: async (testId: number, data: Partial<Test>): Promise<Test> => {
    return api.patch<Test>(API_ENDPOINTS.TEACHER.TEST_DETAIL(testId), data);
  },

  /**
   * Delete test
   */
  deleteTest: async (testId: number): Promise<void> => {
    return api.delete(API_ENDPOINTS.TEACHER.TEST_DETAIL(testId));
  },

  /**
   * Get test results
   */
  getTestResults: async (testId: number): Promise<TestResult[]> => {
    return api.get<TestResult[]>(API_ENDPOINTS.TEACHER.TEST_RESULTS(testId));
  },

  // Questions
  /**
   * Get questions
   */
  getQuestions: async (testId?: number): Promise<Question[]> => {
    const params = testId ? { test: testId } : undefined;
    return api.get<Question[]>(API_ENDPOINTS.TEACHER.QUESTIONS, { params });
  },

  /**
   * Create question
   */
  createQuestion: async (data: Partial<Question>): Promise<Question> => {
    return api.post<Question>(API_ENDPOINTS.TEACHER.QUESTIONS, data);
  },

  /**
   * Update question
   */
  updateQuestion: async (questionId: number, data: Partial<Question>): Promise<Question> => {
    return api.patch<Question>(API_ENDPOINTS.TEACHER.QUESTION_DETAIL(questionId), data);
  },

  /**
   * Delete question
   */
  deleteQuestion: async (questionId: number): Promise<void> => {
    return api.delete(API_ENDPOINTS.TEACHER.QUESTION_DETAIL(questionId));
  },

  // Answers
  /**
   * Get answers
   */
  getAnswers: async (questionId?: number): Promise<Answer[]> => {
    const params = questionId ? { question: questionId } : undefined;
    return api.get<Answer[]>(API_ENDPOINTS.TEACHER.ANSWERS, { params });
  },

  /**
   * Create answer
   */
  createAnswer: async (data: Partial<Answer>): Promise<Answer> => {
    return api.post<Answer>(API_ENDPOINTS.TEACHER.ANSWERS, data);
  },

  /**
   * Update answer
   */
  updateAnswer: async (answerId: number, data: Partial<Answer>): Promise<Answer> => {
    return api.patch<Answer>(API_ENDPOINTS.TEACHER.ANSWER_DETAIL(answerId), data);
  },

  /**
   * Delete answer
   */
  deleteAnswer: async (answerId: number): Promise<void> => {
    return api.delete(API_ENDPOINTS.TEACHER.ANSWER_DETAIL(answerId));
  },

  // Tasks
  /**
   * Get tasks
   */
  getTasks: async (): Promise<Task[]> => {
    return api.get<Task[]>(API_ENDPOINTS.TEACHER.TASKS);
  },

  /**
   * Create task
   */
  createTask: async (data: Partial<Task>): Promise<Task> => {
    return api.post<Task>(API_ENDPOINTS.TEACHER.TASKS, data);
  },

  /**
   * Get task detail
   */
  getTaskDetail: async (taskId: number): Promise<Task> => {
    return api.get<Task>(API_ENDPOINTS.TEACHER.TASK_DETAIL(taskId));
  },

  /**
   * Update task
   */
  updateTask: async (taskId: number, data: Partial<Task>): Promise<Task> => {
    return api.patch<Task>(API_ENDPOINTS.TEACHER.TASK_DETAIL(taskId), data);
  },

  // Submissions
  /**
   * Get submissions
   */
  getSubmissions: async (): Promise<TeacherSubmission[]> => {
    return api.get<TeacherSubmission[]>(API_ENDPOINTS.TEACHER.SUBMISSIONS);
  },

  /**
   * Grade submission
   */
  gradeSubmission: async (submissionId: number, data: { score: number; feedback?: string }): Promise<TeacherSubmission> => {
    return api.patch<TeacherSubmission>(API_ENDPOINTS.TEACHER.SUBMISSION_DETAIL(submissionId), data);
  },

  // Stats
  /**
   * Get course stats
   */
  getCourseStats: async (): Promise<unknown[]> => {
    return api.get(API_ENDPOINTS.TEACHER.COURSE_STATS);
  },

  /**
   * Get course stats detail
   */
  getCourseStatsDetail: async (courseId: number): Promise<unknown> => {
    return api.get(API_ENDPOINTS.TEACHER.COURSE_STATS_DETAIL(courseId));
  },

  /**
   * Get task stats
   */
  getTaskStats: async (taskId: number): Promise<unknown> => {
    return api.get(API_ENDPOINTS.TEACHER.TASK_STATS(taskId));
  },
};

// ============================================
// School Service
// ============================================

export const schoolService = {
  // Courses
  getCourses: async (): Promise<Course[]> => {
    return api.get<Course[]>(API_ENDPOINTS.SCHOOL.COURSES);
  },

  getCourse: async (courseId: number): Promise<Course> => {
    return api.get<Course>(API_ENDPOINTS.SCHOOL.COURSE_DETAIL(courseId));
  },

  createCourse: async (data: Partial<Course>): Promise<Course> => {
    return api.post<Course>(API_ENDPOINTS.SCHOOL.COURSES, data);
  },

  updateCourse: async (courseId: number, data: Partial<Course>): Promise<Course> => {
    return api.patch<Course>(API_ENDPOINTS.SCHOOL.COURSE_DETAIL(courseId), data);
  },

  deleteCourse: async (courseId: number): Promise<void> => {
    return api.delete(API_ENDPOINTS.SCHOOL.COURSE_DETAIL(courseId));
  },

  // Enrollment
  getEnrollments: async (): Promise<Enrollment[]> => {
    return api.get<Enrollment[]>(API_ENDPOINTS.SCHOOL.ENROLLMENT);
  },

  getEnrollment: async (enrollmentId: number): Promise<Enrollment> => {
    return api.get<Enrollment>(API_ENDPOINTS.SCHOOL.ENROLLMENT_DETAIL(enrollmentId));
  },

  createEnrollment: async (data: Partial<Enrollment>): Promise<Enrollment> => {
    return api.post<Enrollment>(API_ENDPOINTS.SCHOOL.ENROLLMENT, data);
  },

  // Students
  getStudents: async (): Promise<Student[]> => {
    return api.get<Student[]>(API_ENDPOINTS.SCHOOL.STUDENTS);
  },

  getStudent: async (studentId: number): Promise<Student> => {
    return api.get<Student>(API_ENDPOINTS.SCHOOL.STUDENT_DETAIL(studentId));
  },

  // Teachers
  getTeachers: async (): Promise<Teacher[]> => {
    return api.get<Teacher[]>(API_ENDPOINTS.SCHOOL.TEACHERS);
  },
};

// ============================================
// Nazorat Service
// ============================================

export const nazoratService = {
  getNazorats: async (): Promise<Nazorat[]> => {
    return api.get<Nazorat[]>(API_ENDPOINTS.NAZORAT.LIST);
  },

  getNazorat: async (id: number): Promise<Nazorat> => {
    return api.get<Nazorat>(API_ENDPOINTS.NAZORAT.DETAIL(id));
  },

  createNazorat: async (data: Partial<Nazorat>): Promise<Nazorat> => {
    return api.post<Nazorat>(API_ENDPOINTS.NAZORAT.LIST, data);
  },

  updateNazorat: async (id: number, data: Partial<Nazorat>): Promise<Nazorat> => {
    return api.patch<Nazorat>(API_ENDPOINTS.NAZORAT.DETAIL(id), data);
  },

  deleteNazorat: async (id: number): Promise<void> => {
    return api.delete(API_ENDPOINTS.NAZORAT.DETAIL(id));
  },

  calculateScores: async (id: number): Promise<unknown> => {
    return api.post(API_ENDPOINTS.NAZORAT.CALCULATE_SCORES(id));
  },

  getResults: async (): Promise<NazoratResult[]> => {
    return api.get<NazoratResult[]>(API_ENDPOINTS.NAZORAT.RESULTS);
  },

  getResultsList: async (): Promise<NazoratResult[]> => {
    return api.get<NazoratResult[]>(API_ENDPOINTS.NAZORAT.RESULTS_LIST);
  },

  getResultDetail: async (id: number): Promise<NazoratResult> => {
    return api.get<NazoratResult>(API_ENDPOINTS.NAZORAT.RESULT_DETAIL(id));
  },
};
