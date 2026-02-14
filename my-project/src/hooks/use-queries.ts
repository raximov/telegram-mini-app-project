/**
 * React Query Hooks
 * Custom hooks for data fetching with React Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { authService, studentService, teacherService, schoolService, nazoratService } from '@/services/api';
import { useAuthStore, useUserStore, useTestStore, useAttemptStore, useUIStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import type {
  SubmitAnswerRequest,
  Test,
  Question,
  Answer,
  Attempt,
  Course,
  Enrollment,
  Task,
  StudentSubmission,
  TeacherSubmission,
  Nazorat,
  NazoratResult,
} from '@/types';

// ============================================
// Mock Data for Development
// ============================================

const MOCK_TESTS: Test[] = [
  {
    id: 1,
    title: 'Mathematics Final Exam',
    description: 'Comprehensive test covering algebra, calculus, and geometry',
    course: 1,
    course_name: 'Mathematics 101',
    teacher: 1,
    teacher_name: 'Prof. Johnson',
    questions: [
      {
        id: 1,
        test: 1,
        question_text: 'What is the derivative of x²?',
        question_type: 'SINGLE',
        points: 10,
        order: 1,
        answers: [
          { id: 1, question: 1, answer_text: '2x', is_correct: true, order: 1, created_at: '', updated_at: '' },
          { id: 2, question: 1, answer_text: 'x', is_correct: false, order: 2, created_at: '', updated_at: '' },
          { id: 3, question: 1, answer_text: 'x²', is_correct: false, order: 3, created_at: '', updated_at: '' },
          { id: 4, question: 1, answer_text: '2', is_correct: false, order: 4, created_at: '', updated_at: '' },
        ],
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        test: 1,
        question_text: 'Select all prime numbers:',
        question_type: 'MULTIPLE',
        points: 15,
        order: 2,
        answers: [
          { id: 5, question: 2, answer_text: '2', is_correct: true, order: 1, created_at: '', updated_at: '' },
          { id: 6, question: 2, answer_text: '4', is_correct: false, order: 2, created_at: '', updated_at: '' },
          { id: 7, question: 2, answer_text: '7', is_correct: true, order: 3, created_at: '', updated_at: '' },
          { id: 8, question: 2, answer_text: '9', is_correct: false, order: 4, created_at: '', updated_at: '' },
          { id: 9, question: 2, answer_text: '11', is_correct: true, order: 5, created_at: '', updated_at: '' },
        ],
        created_at: '',
        updated_at: '',
      },
      {
        id: 3,
        test: 1,
        question_text: 'What is the capital of France?',
        question_type: 'SHORT',
        points: 5,
        order: 3,
        correct_answer: 'Paris',
        answers: [],
        created_at: '',
        updated_at: '',
      },
      {
        id: 4,
        test: 1,
        question_text: 'Calculate: 15 × 8 = ?',
        question_type: 'CALCULATION',
        points: 10,
        order: 4,
        tolerance: 0,
        answers: [
          { id: 10, question: 4, answer_text: '120', is_correct: true, order: 1, created_at: '', updated_at: '' },
        ],
        created_at: '',
        updated_at: '',
      },
    ],
    total_points: 40,
    time_limit: 30,
    max_attempts: 1,
    passing_score: 60,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Physics Quiz - Motion',
    description: 'Test your understanding of Newton\'s laws of motion',
    course: 2,
    course_name: 'Physics 101',
    teacher: 2,
    teacher_name: 'Dr. Smith',
    questions: [],
    total_points: 25,
    time_limit: 20,
    passing_score: 50,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Chemistry Midterm',
    description: 'Organic chemistry reactions and formulas',
    course: 3,
    course_name: 'Chemistry 201',
    teacher: 1,
    teacher_name: 'Prof. Johnson',
    questions: [],
    total_points: 50,
    time_limit: 45,
    passing_score: 70,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'History Essay',
    description: 'Write about the Industrial Revolution',
    course: 4,
    course_name: 'World History',
    teacher: 3,
    teacher_name: 'Ms. Davis',
    questions: [],
    total_points: 30,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_COURSES: Course[] = [
  { id: 1, name: 'Mathematics 101', description: 'Introduction to Mathematics', teacher: 1, created_at: '', updated_at: '', is_active: true },
  { id: 2, name: 'Physics 101', description: 'Introduction to Physics', teacher: 2, created_at: '', updated_at: '', is_active: true },
  { id: 3, name: 'Chemistry 201', description: 'Advanced Chemistry', teacher: 1, created_at: '', updated_at: '', is_active: true },
  { id: 4, name: 'World History', description: 'World History Overview', teacher: 3, created_at: '', updated_at: '', is_active: true },
];

const MOCK_STUDENT_TESTS = MOCK_TESTS.map((test, index) => ({
  ...test,
  attempt: index === 0 ? {
    id: 100 + index,
    test: test.id,
    student: 1,
    status: 'IN_PROGRESS',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    answers: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : index === 2 ? {
    id: 100 + index,
    test: test.id,
    student: 1,
    status: 'GRADED',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    submitted_at: new Date(Date.now() - 3600000).toISOString(),
    score: 35,
    max_score: 50,
    percentage: 70,
    passed: true,
    time_spent: 2400,
    answers: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : undefined,
}));

// Query keys for cache management
export const queryKeys = {
  profile: ['profile'] as const,
  studentTests: (filters?: Record<string, unknown>) => ['studentTests', filters] as const,
  teacherTests: () => ['teacherTests'] as const,
  test: (id: number) => ['test', id] as const,
  testResults: (testId: number) => ['testResults', testId] as const,
  questions: (testId?: number) => ['questions', testId] as const,
  question: (id: number) => ['question', id] as const,
  answers: (questionId?: number) => ['answers', questionId] as const,
  attempt: (id: number) => ['attempt', id] as const,
  attemptResult: (id: number) => ['attemptResult', id] as const,
  courses: () => ['courses'] as const,
  course: (id: number) => ['course', id] as const,
  enrollments: () => ['enrollments'] as const,
  studentTasks: () => ['studentTasks'] as const,
  teacherTasks: () => ['teacherTasks'] as const,
  task: (id: number) => ['task', id] as const,
  studentSubmissions: () => ['studentSubmissions'] as const,
  teacherSubmissions: () => ['teacherSubmissions'] as const,
  nazorats: () => ['nazorats'] as const,
  nazorat: (id: number) => ['nazorat', id] as const,
  nazoratResults: () => ['nazoratResults'] as const,
  students: () => ['students'] as const,
  teachers: () => ['teachers'] as const,
};

// Helper to check if we should use mock data
const shouldUseMockData = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || !process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return false;
};

// ============================================
// Auth Hooks
// ============================================

export function useTelegramAuth() {
  const queryClient = useQueryClient();
  const { setToken, setLoading, setError } = useAuthStore();
  const { setUser } = useUserStore();

  return useMutation({
    mutationFn: (initData: string) => authService.loginWithTelegram(initData),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: async (data) => {
      setToken(data.token);
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        // Profile fetch failed
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setToken, setLoading, setError } = useAuthStore();
  const { setUser } = useUserStore();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authService.login(username, password),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: async (data) => {
      setToken(data.token);
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        // Profile fetch failed
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearToken } = useAuthStore();
  const { clearUser } = useUserStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearToken();
      clearUser();
      queryClient.clear();
    },
  });
}

export function useProfile() {
  const { user } = useUserStore();

  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: async () => {
      // Return mock user for development
      return user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    initialData: user,
  });
}

// ============================================
// Student Test Hooks
// ============================================

export function useStudentTests(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.studentTests(filters),
    queryFn: async () => {
      // Use mock data for development
      if (shouldUseMockData()) {
        return MOCK_STUDENT_TESTS;
      }
      return studentService.getTests(filters);
    },
    staleTime: 2 * 60 * 1000,
    initialData: shouldUseMockData() ? MOCK_STUDENT_TESTS : undefined,
  });
}

export function useStartTest() {
  const queryClient = useQueryClient();
  const { setCurrentAttempt, setLoading, setError } = useAttemptStore();

  return useMutation({
    mutationFn: (testId: number) => {
      // Mock start test
      if (shouldUseMockData()) {
        return Promise.resolve({
          id: Date.now(),
          test: testId,
          student: 1,
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          answers: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Attempt);
      }
      return studentService.startTest(testId);
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (attempt) => {
      setCurrentAttempt(attempt);
      queryClient.setQueryData(queryKeys.attempt(attempt.id), attempt);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  const { setAnswer, setError } = useAttemptStore();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({ attemptId, answer }: { attemptId: number; answer: SubmitAnswerRequest }) => {
      if (shouldUseMockData()) {
        return Promise.resolve({
          id: attemptId,
          answers: [{ question: answer.question_id, selected_answers: answer.selected_answers, text_answer: answer.text_answer, numeric_answer: answer.numeric_answer }],
        } as unknown as Attempt);
      }
      return studentService.submitAnswer(attemptId, answer);
    },
    onSuccess: (attempt, { answer }) => {
      const attemptAnswer = attempt.answers?.find((a) => a.question === answer.question_id);
      if (attemptAnswer) {
        setAnswer(answer.question_id, attemptAnswer);
      }
      queryClient.setQueryData(queryKeys.attempt(attempt.id), attempt);
    },
    onError: (error: Error) => {
      setError(error.message);
      showToast({ type: 'error', title: 'Failed to submit answer', message: error.message });
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  const { setCurrentAttempt, clearAnswers, setError } = useAttemptStore();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (attemptId: number) => {
      if (shouldUseMockData()) {
        return Promise.resolve({
          attempt: {
            id: attemptId,
            status: 'GRADED',
            score: 35,
            max_score: 40,
            percentage: 87.5,
            passed: true,
          },
          score: 35,
          max_score: 40,
          percentage: 87.5,
          passed: true,
          correct_count: 3,
          total_questions: 4,
          time_spent: 1200,
          detailed_results: [],
        });
      }
      return studentService.submitAttempt(attemptId);
    },
    onSuccess: (result) => {
      clearAnswers();
      showToast({ type: 'success', title: 'Test submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.attemptResult(result.attempt.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentTests() });
    },
    onError: (error: Error) => {
      setError(error.message);
      showToast({ type: 'error', title: 'Failed to submit test', message: error.message });
    },
  });
}

export function useAttemptResult(attemptId: number) {
  return useQuery({
    queryKey: queryKeys.attemptResult(attemptId),
    queryFn: async () => {
      if (shouldUseMockData()) {
        return {
          attempt: {
            id: attemptId,
            test: 1,
            test_title: 'Mathematics Final Exam',
            status: 'GRADED',
            score: 35,
            max_score: 40,
            percentage: 87.5,
            passed: true,
            time_spent: 1200,
            submitted_at: new Date().toISOString(),
            answers: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          score: 35,
          max_score: 40,
          percentage: 87.5,
          passed: true,
          correct_count: 3,
          total_questions: 4,
          time_spent: 1200,
          detailed_results: MOCK_TESTS[0].questions.map((q, i) => ({
            question: q,
            user_answer: { question: q.id, selected_answers: [1], question_type: q.question_type },
            is_correct: i !== 2,
            points_earned: i === 2 ? 0 : q.points,
          })),
        };
      }
      return studentService.getAttemptResult(attemptId);
    },
    enabled: !!attemptId,
    staleTime: Infinity,
  });
}

// ============================================
// Teacher Test Hooks
// ============================================

export function useTeacherTests() {
  return useQuery({
    queryKey: queryKeys.teacherTests(),
    queryFn: async () => {
      if (shouldUseMockData()) {
        return MOCK_TESTS;
      }
      return teacherService.getTests();
    },
    staleTime: 2 * 60 * 1000,
    initialData: shouldUseMockData() ? MOCK_TESTS : undefined,
  });
}

export function useTeacherTest(testId: number) {
  return useQuery({
    queryKey: queryKeys.test(testId),
    queryFn: async () => {
      if (shouldUseMockData()) {
        return MOCK_TESTS.find(t => t.id === testId) || MOCK_TESTS[0];
      }
      return teacherService.getTest(testId);
    },
    enabled: !!testId,
    initialData: shouldUseMockData() ? MOCK_TESTS.find(t => t.id === testId) : undefined,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  const { addTest, setLoading, setError } = useTestStore();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (data: Partial<Test>) => {
      if (shouldUseMockData()) {
        return Promise.resolve({ ...data, id: Date.now() } as Test);
      }
      return teacherService.createTest(data);
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (test) => {
      addTest(test);
      showToast({ type: 'success', title: 'Test created successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherTests() });
    },
    onError: (error: Error) => {
      setError(error.message);
      showToast({ type: 'error', title: 'Failed to create test', message: error.message });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  const { updateTest, setError } = useTestStore();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({ testId, data }: { testId: number; data: Partial<Test> }) => {
      if (shouldUseMockData()) {
        return Promise.resolve({ ...data, id: testId } as Test);
      }
      return teacherService.updateTest(testId, data);
    },
    onSuccess: (test) => {
      updateTest(test.id, test);
      showToast({ type: 'success', title: 'Test updated successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.test(test.id) });
    },
    onError: (error: Error) => {
      setError(error.message);
      showToast({ type: 'error', title: 'Failed to update test', message: error.message });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  const { removeTest, setError } = useTestStore();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (testId: number) => {
      if (shouldUseMockData()) {
        return Promise.resolve();
      }
      return teacherService.deleteTest(testId);
    },
    onSuccess: (_, testId) => {
      removeTest(testId);
      showToast({ type: 'success', title: 'Test deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherTests() });
    },
    onError: (error: Error) => {
      setError(error.message);
      showToast({ type: 'error', title: 'Failed to delete test', message: error.message });
    },
  });
}

export function useTestResults(testId: number) {
  return useQuery({
    queryKey: queryKeys.testResults(testId),
    queryFn: async () => {
      if (shouldUseMockData()) {
        return [
          { id: 1, student_name: 'John Doe', score: 35, max_score: 40, percentage: 87.5, passed: true, submitted_at: new Date().toISOString(), time_spent: 1200 },
          { id: 2, student_name: 'Jane Smith', score: 28, max_score: 40, percentage: 70, passed: true, submitted_at: new Date().toISOString(), time_spent: 1800 },
          { id: 3, student_name: 'Bob Wilson', score: 18, max_score: 40, percentage: 45, passed: false, submitted_at: new Date().toISOString(), time_spent: 2400 },
        ];
      }
      return teacherService.getTestResults(testId);
    },
    enabled: !!testId,
    staleTime: 30 * 1000,
  });
}

// ============================================
// Question Hooks
// ============================================

export function useQuestions(testId?: number) {
  return useQuery({
    queryKey: queryKeys.questions(testId),
    queryFn: async () => {
      if (shouldUseMockData() && testId) {
        const test = MOCK_TESTS.find(t => t.id === testId);
        return test?.questions || [];
      }
      return teacherService.getQuestions(testId);
    },
    enabled: testId !== undefined,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (data: Partial<Question>) => {
      if (shouldUseMockData()) {
        return Promise.resolve({ ...data, id: Date.now() } as Question);
      }
      return teacherService.createQuestion(data);
    },
    onSuccess: (question) => {
      showToast({ type: 'success', title: 'Question created successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(question.test) });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to create question', message: error.message });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: Partial<Question> }) => {
      if (shouldUseMockData()) {
        return Promise.resolve({ ...data, id: questionId } as Question);
      }
      return teacherService.updateQuestion(questionId, data);
    },
    onSuccess: (question) => {
      showToast({ type: 'success', title: 'Question updated successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(question.test) });
      queryClient.invalidateQueries({ queryKey: queryKeys.question(question.id) });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to update question', message: error.message });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (questionId: number) => {
      if (shouldUseMockData()) {
        return Promise.resolve();
      }
      return teacherService.deleteQuestion(questionId);
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Question deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to delete question', message: error.message });
    },
  });
}

// ============================================
// Answer Hooks
// ============================================

export function useAnswers(questionId?: number) {
  return useQuery({
    queryKey: queryKeys.answers(questionId),
    queryFn: () => teacherService.getAnswers(questionId),
    enabled: questionId !== undefined,
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (data: Partial<Answer>) => teacherService.createAnswer(data),
    onSuccess: (answer) => {
      showToast({ type: 'success', title: 'Answer created successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(answer.question) });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to create answer', message: error.message });
    },
  });
}

export function useUpdateAnswer() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({ answerId, data }: { answerId: number; data: Partial<Answer> }) =>
      teacherService.updateAnswer(answerId, data),
    onSuccess: (answer) => {
      showToast({ type: 'success', title: 'Answer updated successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(answer.question) });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to update answer', message: error.message });
    },
  });
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (answerId: number) => teacherService.deleteAnswer(answerId),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Answer deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to delete answer', message: error.message });
    },
  });
}

// ============================================
// Course Hooks
// ============================================

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses(),
    queryFn: async () => {
      if (shouldUseMockData()) {
        return MOCK_COURSES;
      }
      return schoolService.getCourses();
    },
    staleTime: 5 * 60 * 1000,
    initialData: shouldUseMockData() ? MOCK_COURSES : undefined,
  });
}

export function useCourse(courseId: number) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => schoolService.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (data: Partial<Course>) => schoolService.createCourse(data),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Course created successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to create course', message: error.message });
    },
  });
}

// ============================================
// Enrollment Hooks
// ============================================

export function useEnrollments() {
  return useQuery({
    queryKey: queryKeys.enrollments(),
    queryFn: () => schoolService.getEnrollments(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: (data: Partial<Enrollment>) => schoolService.createEnrollment(data),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Enrollment created successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to create enrollment', message: error.message });
    },
  });
}

// ============================================
// Task Hooks
// ============================================

export function useStudentTasks() {
  return useQuery({
    queryKey: queryKeys.studentTasks(),
    queryFn: () => studentService.getTasks(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTeacherTasks() {
  return useQuery({
    queryKey: queryKeys.teacherTasks(),
    queryFn: () => teacherService.getTasks(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTask(taskId: number, role: 'student' | 'teacher') {
  return useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: () =>
      role === 'student' ? studentService.getTaskDetail(taskId) : teacherService.getTaskDetail(taskId),
    enabled: !!taskId,
  });
}

// ============================================
// Submission Hooks
// ============================================

export function useStudentSubmissions() {
  return useQuery({
    queryKey: queryKeys.studentSubmissions(),
    queryFn: () => studentService.getSubmissions(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTeacherSubmissions() {
  return useQuery({
    queryKey: queryKeys.teacherSubmissions(),
    queryFn: () => teacherService.getSubmissions(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubmitTask() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: number; data: Partial<StudentSubmission> }) =>
      studentService.submitTask(submissionId, data),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Task submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentSubmissions() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to submit task', message: error.message });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: number;
      data: { score: number; feedback?: string };
    }) => teacherService.gradeSubmission(submissionId, data),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Submission graded successfully!' });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSubmissions() });
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Failed to grade submission', message: error.message });
    },
  });
}

// ============================================
// Nazorat Hooks
// ============================================

export function useNazorats() {
  return useQuery({
    queryKey: queryKeys.nazorats(),
    queryFn: () => nazoratService.getNazorats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNazorat(id: number) {
  return useQuery({
    queryKey: queryKeys.nazorat(id),
    queryFn: () => nazoratService.getNazorat(id),
    enabled: !!id,
  });
}

export function useNazoratResults() {
  return useQuery({
    queryKey: queryKeys.nazoratResults(),
    queryFn: () => nazoratService.getResults(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Utility Hooks
// ============================================

export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students(),
    queryFn: () => schoolService.getStudents(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: queryKeys.teachers(),
    queryFn: () => schoolService.getTeachers(),
    staleTime: 10 * 60 * 1000,
  });
}
