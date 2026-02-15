import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { appEnv } from "@/config/env";
import { clearSession } from "@/store/slices/authSlice";
import { clearProfile } from "@/store/slices/userSlice";
import { runMockRequest } from "@/store/api/mockBaseQuery";
import type {
  AttemptAnswerInput,
  AttemptResult,
  Course,
  Enrollment,
  QuestionType,
  Role,
  StartAttemptResponse,
  StudentQuestion,
  StudentTestSummary,
  TeacherAttemptDetail,
  TeacherQuestion,
  TeacherQuestionInput,
  TeacherResultsSummary,
  TeacherTest,
  UserProfile,
} from "@/types/domain";

type AuthStateShape = {
  auth: {
    token: string | null;
  };
};

type LoginResponse = {
  token: string;
  expiresAt?: string;
};

type BackendStudentTest = {
  id: number;
  title: string;
  teacher?: number | null;
  question_count?: number;
  created_at?: string;
};

type BackendStartAttempt = {
  attempt_id: number;
  test_id: number;
  started_at: string;
  test?: {
    id: number;
    title: string;
    questions?: BackendStartQuestion[];
  };
};

type BackendStartQuestion = {
  id: number;
  text: string;
  question_type: string;
  mark: number;
  input_kind?: "text" | "numeric";
  answer_options?: BackendStartQuestionOption[];
};

type BackendStartQuestionOption = {
  id: number;
  text: string;
};

type BackendAttemptResult = {
  attempt_id: number;
  test_id?: number;
  score?: number;
  percentage?: number;
  completed_at?: string;
  total_questions?: number;
  total_answers?: number;
};

type BackendTeacherTest = {
  id: number;
  title: string;
  teacher?: number;
};

type BackendQuestion = {
  id: number;
  text: string;
  question_type: string;
  mark: number;
  test: number;
};

type BackendAnswer = {
  id: number;
  question: number;
  text: string;
  is_correct: boolean;
  match_text?: string | null;
};

type BackendTeacherResult = {
  attempt_id: number;
  student_name?: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  completed_at?: string | null;
};

type BackendTeacherAttemptQuestion = {
  question_id: number;
  prompt?: string;
  question_type?: string;
  score?: number;
  max_score?: number;
  written_answer?: string | null;
  selected_answers?: Array<{ id?: number; text?: string }>;
  correct_answers?: Array<{ id?: number; text?: string }>;
};

type BackendTeacherAttemptDetail = {
  attempt_id: number;
  test_id: number;
  test_title?: string;
  student_id?: number;
  student_name?: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  started_at?: string;
  completed_at?: string | null;
  questions?: BackendTeacherAttemptQuestion[];
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: appEnv.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as AuthStateShape;
    const token = state.auth.token;

    if (token) {
      headers.set("Authorization", `Token ${token}`);
    }

    headers.set("Accept", "application/json");
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
  timeout: appEnv.requestTimeoutMs,
});

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const makeError = (status: number, detail: string): FetchBaseQueryError => ({
  status,
  data: { detail },
});

const defaultExpiry = (): string => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

const normalizeNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitHumanName = (value: string): { firstName: string; lastName: string } => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "User", lastName: "" };
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
};

const makeProfile = (
  payload: { id?: number; name?: string; email?: string; username?: string },
  role: Role
): UserProfile => {
  const rawName = payload.name ?? payload.username ?? "User";
  const { firstName, lastName } = splitHumanName(rawName);
  const usernameFromEmail = payload.email?.split("@")[0];

  return {
    id: normalizeNumber(payload.id, 0),
    username: payload.username ?? usernameFromEmail ?? `${role}_${normalizeNumber(payload.id, 0)}`,
    firstName,
    lastName,
    role,
  };
};

const mapStudentQuestionType = (questionType: string, answers: BackendAnswer[]): QuestionType => {
  if (questionType === "OC") {
    return "single";
  }

  if (questionType === "MC") {
    return "multiple";
  }

  if (questionType === "WR") {
    const correct = answers.find((answer) => answer.is_correct);
    const numeric = correct ? Number(correct.text) : Number.NaN;
    if (Number.isFinite(numeric)) {
      return "numeric";
    }
    return "short";
  }

  return "short";
};

const mapBackendQuestionType = (questionType: QuestionType): "OC" | "MC" | "WR" => {
  if (questionType === "single") {
    return "OC";
  }

  if (questionType === "multiple") {
    return "MC";
  }

  return "WR";
};

const parseQuestionType = (value: unknown): QuestionType => {
  if (value === "single" || value === "multiple" || value === "short" || value === "numeric") {
    return value;
  }

  if (value === "OC") {
    return "single";
  }

  if (value === "MC") {
    return "multiple";
  }

  return "short";
};

const toTeacherQuestion = (question: BackendQuestion, answers: BackendAnswer[]): TeacherQuestion => {
  const mappedType = mapStudentQuestionType(question.question_type, answers);
  const correctAnswer = answers.find((answer) => answer.is_correct);
  const numericCorrect = correctAnswer ? Number(correctAnswer.text) : Number.NaN;
  const tolerance = correctAnswer?.match_text ? Number(correctAnswer.match_text) : Number.NaN;

  return {
    id: question.id,
    prompt: question.text,
    type: mappedType,
    points: normalizeNumber(question.mark, 1),
    options: answers.map((answer) => ({ id: answer.id, text: answer.text })),
    correctOptionIds: answers.filter((answer) => answer.is_correct).map((answer) => answer.id),
    correctText: mappedType === "short" ? correctAnswer?.text ?? null : null,
    correctNumber: mappedType === "numeric" && Number.isFinite(numericCorrect) ? numericCorrect : null,
    tolerance: Number.isFinite(tolerance) ? tolerance : null,
    explanation: "",
  };
};

const toStudentQuestion = (question: TeacherQuestion): StudentQuestion => ({
  id: question.id,
  prompt: question.prompt,
  type: question.type,
  points: question.points,
  options: question.options,
});

const mapStartQuestionType = (question: BackendStartQuestion): QuestionType => {
  if (question.question_type === "OC") {
    return "single";
  }

  if (question.question_type === "MC") {
    return "multiple";
  }

  if (question.question_type === "WR") {
    return question.input_kind === "numeric" ? "numeric" : "short";
  }

  // ORD/MAT are not yet fully supported in current student renderer/scoring flow.
  return "short";
};

const toStudentQuestionFromStart = (question: BackendStartQuestion): StudentQuestion => {
  const mappedType = mapStartQuestionType(question);

  return {
    id: question.id,
    prompt: question.text,
    type: mappedType,
    points: normalizeNumber(question.mark, 1),
    options:
      mappedType === "single" || mappedType === "multiple"
        ? (question.answer_options ?? []).map((option) => ({
            id: option.id,
            text: option.text,
          }))
        : [],
  };
};

const buildAnswerPayloads = (input: TeacherQuestionInput): Array<{ text: string; is_correct: boolean }> => {
  if (input.type === "single" || input.type === "multiple") {
    return input.options
      .map((option) => ({ text: option.text.trim(), is_correct: option.isCorrect }))
      .filter((option) => option.text.length > 0);
  }

  if (input.type === "short") {
    const text = (input.correctText ?? "").trim();
    if (!text) {
      return [];
    }

    return [{ text, is_correct: true }];
  }

  const numeric = normalizeNumber(input.correctNumber, Number.NaN);
  if (!Number.isFinite(numeric)) {
    return [];
  }

  return [{ text: String(numeric), is_correct: true }];
};

const baseQueryWithMode: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  if (appEnv.useMockData) {
    await delay(appEnv.requestLatencyMs);
    const state = api.getState() as AuthStateShape;
    const result = await runMockRequest(args, state.auth.token);

    if (result.error?.status === 401) {
      api.dispatch(clearSession());
      api.dispatch(clearProfile());
    }

    return result as { data?: unknown; error?: FetchBaseQueryError };
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    api.dispatch(clearSession());
    api.dispatch(clearProfile());
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithMode,
  tagTypes: ["Profile", "StudentTests", "Attempt", "TeacherTests", "TeacherResults", "Courses", "Enrollment"],
  endpoints: (builder) => ({
    loginWithTelegram: builder.mutation<LoginResponse, { initData: string; roleHint?: Role }>({
      queryFn: async (payload, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: appEnv.useMockData ? "/school/login/" : "/school/telegram/login/",
          method: "POST",
          body: payload,
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as { token?: string; expiresAt?: string };
        if (!data?.token) {
          return { error: makeError(500, "Login response does not include token.") };
        }

        return {
          data: {
            token: data.token,
            expiresAt: data.expiresAt ?? defaultExpiry(),
          },
        };
      },
    }),

    loginWithCredentials: builder.mutation<LoginResponse, { username: string; password: string; roleHint?: Role }>({
      queryFn: async (payload, _api, _extraOptions, baseQuery) => {
        const body = appEnv.useMockData
          ? { username: payload.username, password: payload.password, roleHint: payload.roleHint }
          : { username: payload.username, password: payload.password };

        const result = await baseQuery({
          url: "/api-token-auth/",
          method: "POST",
          body,
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as { token?: string; key?: string; expiresAt?: string };
        const token = data?.token ?? data?.key;

        if (!token) {
          return { error: makeError(500, "Auth token was not returned by backend.") };
        }

        return {
          data: {
            token,
            expiresAt: data.expiresAt ?? defaultExpiry(),
          },
        };
      },
    }),

    logout: builder.mutation<{ success: true }, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: "/school/logout/",
          method: "POST",
        });

        if (result.error) {
          // Token based auth does not require logout endpoint success.
          return { data: { success: true } };
        }

        return { data: { success: true } };
      },
    }),

    getProfile: builder.query<UserProfile, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockProfile = await baseQuery("/school/profile/");
          if (mockProfile.error) {
            return { error: mockProfile.error };
          }

          return { data: mockProfile.data as UserProfile };
        }

        const teacherResult = await baseQuery("/school/teacher/");
        if (teacherResult.data) {
          const teacher = teacherResult.data as { id?: number; name?: string; email?: string; username?: string };
          return { data: makeProfile(teacher, "teacher") };
        }

        if (teacherResult.error?.status === 401) {
          return { error: teacherResult.error };
        }

        const studentResult = await baseQuery("/school/student/");
        if (studentResult.data) {
          const student = studentResult.data as { id?: number; name?: string; email?: string; username?: string };
          return { data: makeProfile(student, "student") };
        }

        if (studentResult.error) {
          return { error: studentResult.error };
        }

        return { error: makeError(404, "Unable to resolve user profile role.") };
      },
      providesTags: ["Profile"],
    }),

    getStudentTests: builder.query<StudentTestSummary[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery("/testapp/api/v1/student/tests/");
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as StudentTestSummary[] };
        }

        const result = await baseQuery("/testapp/api/v1/student/tests/");
        if (result.error) {
          return { error: result.error };
        }

        const rows = Array.isArray(result.data) ? (result.data as BackendStudentTest[]) : [];
        const mapped = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: "",
          questionCount: normalizeNumber(row.question_count, 0),
          timeLimitSec: 1800,
          status: "open" as const,
        }));

        return { data: mapped };
      },
      providesTags: ["StudentTests"],
    }),

    startStudentTest: builder.mutation<StartAttemptResponse, { testId: number }>({
      queryFn: async ({ testId }, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockStart = await baseQuery({
            url: `/testapp/api/v1/student/tests/${testId}/start/`,
            method: "POST",
          });

          if (mockStart.error) {
            return { error: mockStart.error };
          }

          return { data: mockStart.data as StartAttemptResponse };
        }

        const start = await baseQuery({
          url: `/testapp/api/v1/student/tests/${testId}/start/`,
          method: "POST",
        });

        if (start.error) {
          return { error: start.error };
        }

        const startData = start.data as BackendStartAttempt;

        const tests = await baseQuery("/testapp/api/v1/student/tests/");
        const testList = Array.isArray(tests.data) ? (tests.data as BackendStudentTest[]) : [];
        const current = testList.find((item) => item.id === testId);
        const rawQuestions = Array.isArray(startData.test?.questions) ? startData.test?.questions : [];
        const mappedQuestions = rawQuestions.map(toStudentQuestionFromStart);

        const startedAt = startData.started_at ?? new Date().toISOString();

        return {
          data: {
            attempt: {
              id: startData.attempt_id,
              testId,
              status: "in_progress",
              startedAt,
              expiresAt: new Date(new Date(startedAt).getTime() + 30 * 60 * 1000).toISOString(),
              submittedAt: null,
            },
            test: {
              id: testId,
              title: startData.test?.title ?? current?.title ?? `Test ${testId}`,
              description: "",
              timeLimitSec: 1800,
              questions: mappedQuestions,
            },
          },
        };
      },
      invalidatesTags: ["StudentTests", "Attempt"],
    }),

    submitStudentAttempt: builder.mutation<AttemptResult, { attemptId: number; answers: AttemptAnswerInput[] }>({
      queryFn: async ({ attemptId, answers }, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockSubmit = await baseQuery({
            url: `/testapp/api/v1/student/attempts/${attemptId}/submit/`,
            method: "POST",
            body: { answers },
          });

          if (mockSubmit.error) {
            return { error: mockSubmit.error };
          }

          return { data: mockSubmit.data as AttemptResult };
        }

        const payload = {
          answers: answers.map((item) => ({
            question_id: item.questionId,
            selected_option_ids: item.selectedOptionIds ?? [],
            written_answer:
              typeof item.numericAnswer === "number"
                ? String(item.numericAnswer)
                : (item.textAnswer ?? ""),
          })),
        };

        const result = await baseQuery({
          url: `/testapp/api/v1/student/attempts/${attemptId}/submit/`,
          method: "POST",
          body: payload,
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as BackendAttemptResult;
        const percent = normalizeNumber(data.percentage, 0);
        const score = normalizeNumber(data.score, 0);
        const maxScore = percent > 0 ? (score * 100) / percent : score;

        return {
          data: {
            attemptId: data.attempt_id,
            testId: normalizeNumber(data.test_id, 0),
            testTitle: `Attempt ${data.attempt_id}`,
            score,
            maxScore: Number.isFinite(maxScore) ? Number(maxScore.toFixed(2)) : score,
            percentage: percent,
            passed: percent >= 60,
            submittedAt: data.completed_at ?? new Date().toISOString(),
            breakdown: [],
          },
        };
      },
      invalidatesTags: ["StudentTests", "Attempt"],
    }),

    getStudentAttemptResult: builder.query<AttemptResult, number>({
      queryFn: async (attemptId, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery(`/testapp/api/v1/student/attempts/${attemptId}/result/`);
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as AttemptResult };
        }

        const result = await baseQuery(`/testapp/api/v1/student/attempts/${attemptId}/result/`);
        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as BackendAttemptResult;
        const percent = normalizeNumber(data.percentage, 0);
        const score = normalizeNumber(data.score, 0);
        const maxScore = percent > 0 ? (score * 100) / percent : score;

        return {
          data: {
            attemptId: data.attempt_id,
            testId: normalizeNumber(data.test_id, 0),
            testTitle: `Attempt ${data.attempt_id}`,
            score,
            maxScore: Number.isFinite(maxScore) ? Number(maxScore.toFixed(2)) : score,
            percentage: percent,
            passed: percent >= 60,
            submittedAt: data.completed_at ?? new Date().toISOString(),
            breakdown: [],
          },
        };
      },
      providesTags: (_result, _error, attemptId) => [{ type: "Attempt", id: attemptId }],
    }),

    getTeacherTests: builder.query<TeacherTest[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery("/testapp/teacher/tests/");
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherTest[] };
        }

        const result = await baseQuery("/testapp/teacher/tests/");
        if (result.error) {
          return { error: result.error };
        }

        const rows = Array.isArray(result.data) ? (result.data as BackendTeacherTest[]) : [];
        return {
          data: rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: "",
            status: "draft",
            timeLimitSec: 1800,
            passingPercent: 60,
            courseId: null,
            questions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        };
      },
      providesTags: ["TeacherTests"],
    }),

    getTeacherTest: builder.query<TeacherTest, number>({
      queryFn: async (testId, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery(`/testapp/teacher/tests/${testId}/`);
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherTest };
        }

        const testResult = await baseQuery(`/testapp/teacher/tests/${testId}/`);
        if (testResult.error) {
          return { error: testResult.error };
        }

        const test = testResult.data as BackendTeacherTest;
        const questionResult = await baseQuery(`/testapp/teacher/questions/?test=${testId}`);
        if (questionResult.error) {
          return { error: questionResult.error };
        }

        const questions = Array.isArray(questionResult.data) ? (questionResult.data as BackendQuestion[]) : [];
        const mappedQuestions: TeacherQuestion[] = [];

        for (const question of questions) {
          const answersResult = await baseQuery(`/testapp/teacher/answers/?question=${question.id}`);
          if (answersResult.error) {
            return { error: answersResult.error };
          }

          const answers = Array.isArray(answersResult.data) ? (answersResult.data as BackendAnswer[]) : [];
          mappedQuestions.push(toTeacherQuestion(question, answers));
        }

        return {
          data: {
            id: test.id,
            title: test.title,
            description: "",
            status: "draft",
            timeLimitSec: 1800,
            passingPercent: 60,
            courseId: null,
            questions: mappedQuestions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      },
      providesTags: (_result, _error, testId) => [{ type: "TeacherTests", id: testId }],
    }),

    createTeacherTest: builder.mutation<TeacherTest, Partial<TeacherTest>>({
      queryFn: async (payload, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery({
            url: "/testapp/teacher/tests/",
            method: "POST",
            body: payload,
          });

          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherTest };
        }

        const result = await baseQuery({
          url: "/testapp/teacher/tests/",
          method: "POST",
          body: { title: payload.title ?? "Untitled Test" },
        });

        if (result.error) {
          return { error: result.error };
        }

        const row = result.data as BackendTeacherTest;
        return {
          data: {
            id: row.id,
            title: row.title,
            description: "",
            status: "draft",
            timeLimitSec: 1800,
            passingPercent: 60,
            courseId: null,
            questions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      },
      invalidatesTags: ["TeacherTests"],
    }),

    updateTeacherTest: builder.mutation<TeacherTest, { id: number; data: Partial<TeacherTest> }>({
      queryFn: async ({ id, data }, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery({
            url: `/testapp/teacher/tests/${id}/`,
            method: "PATCH",
            body: data,
          });

          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherTest };
        }

        const result = await baseQuery({
          url: `/testapp/teacher/tests/${id}/`,
          method: "PATCH",
          body: { title: data.title ?? "Untitled Test" },
        });

        if (result.error) {
          return { error: result.error };
        }

        const row = result.data as BackendTeacherTest;
        return {
          data: {
            id: row.id,
            title: row.title,
            description: "",
            status: "draft",
            timeLimitSec: 1800,
            passingPercent: 60,
            courseId: null,
            questions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      },
      invalidatesTags: (_result, _error, payload) => ["TeacherTests", { type: "TeacherTests", id: payload.id }],
    }),

    deleteTeacherTest: builder.mutation<{ success: true }, number>({
      query: (testId) => ({
        url: `/testapp/teacher/tests/${testId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeacherTests"],
    }),

    createTeacherQuestion: builder.mutation<TeacherQuestion, { testId: number; question: TeacherQuestionInput }>({
      queryFn: async ({ testId, question }, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery({
            url: "/testapp/teacher/questions/",
            method: "POST",
            body: { testId, question },
          });

          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherQuestion };
        }

        const createQuestionResult = await baseQuery({
          url: "/testapp/teacher/questions/",
          method: "POST",
          body: {
            text: question.prompt,
            question_type: mapBackendQuestionType(question.type),
            mark: question.points,
            test: testId,
          },
        });

        if (createQuestionResult.error) {
          return { error: createQuestionResult.error };
        }

        const createdQuestion = createQuestionResult.data as BackendQuestion;
        const answerPayloads = buildAnswerPayloads(question);
        const createdAnswers: BackendAnswer[] = [];

        for (const payload of answerPayloads) {
          const createAnswerResult = await baseQuery({
            url: "/testapp/teacher/answers/",
            method: "POST",
            body: {
              question: createdQuestion.id,
              text: payload.text,
              is_correct: payload.is_correct,
            },
          });

          if (createAnswerResult.error) {
            return { error: createAnswerResult.error };
          }

          createdAnswers.push(createAnswerResult.data as BackendAnswer);
        }

        return { data: toTeacherQuestion(createdQuestion, createdAnswers) };
      },
      invalidatesTags: ["TeacherTests"],
    }),

    updateTeacherQuestion: builder.mutation<TeacherQuestion, { questionId: number; testId: number; question: TeacherQuestionInput }>({
      queryFn: async ({ questionId, testId, question }, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery({
            url: `/testapp/teacher/questions/${questionId}/`,
            method: "PATCH",
            body: question,
          });

          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherQuestion };
        }

        const updateQuestionResult = await baseQuery({
          url: `/testapp/teacher/questions/${questionId}/`,
          method: "PATCH",
          body: {
            text: question.prompt,
            question_type: mapBackendQuestionType(question.type),
            mark: question.points,
            test: testId,
          },
        });

        if (updateQuestionResult.error) {
          return { error: updateQuestionResult.error };
        }

        const currentAnswersResult = await baseQuery(`/testapp/teacher/answers/?question=${questionId}`);
        if (currentAnswersResult.error) {
          return { error: currentAnswersResult.error };
        }

        const currentAnswers = Array.isArray(currentAnswersResult.data)
          ? (currentAnswersResult.data as BackendAnswer[])
          : [];

        for (const answer of currentAnswers) {
          const deleteResult = await baseQuery({
            url: `/testapp/teacher/answers/${answer.id}/`,
            method: "DELETE",
          });

          if (deleteResult.error) {
            return { error: deleteResult.error };
          }
        }

        const payloads = buildAnswerPayloads(question);
        const recreatedAnswers: BackendAnswer[] = [];

        for (const payload of payloads) {
          const createResult = await baseQuery({
            url: "/testapp/teacher/answers/",
            method: "POST",
            body: {
              question: questionId,
              text: payload.text,
              is_correct: payload.is_correct,
            },
          });

          if (createResult.error) {
            return { error: createResult.error };
          }

          recreatedAnswers.push(createResult.data as BackendAnswer);
        }

        return { data: toTeacherQuestion(updateQuestionResult.data as BackendQuestion, recreatedAnswers) };
      },
      invalidatesTags: ["TeacherTests"],
    }),

    deleteTeacherQuestion: builder.mutation<{ success: true }, number>({
      query: (questionId) => ({
        url: `/testapp/teacher/questions/${questionId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeacherTests"],
    }),

    getTeacherTestResults: builder.query<TeacherResultsSummary, number>({
      queryFn: async (testId, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery(`/testapp/teacher/test/${testId}/results/`);
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherResultsSummary };
        }

        const result = await baseQuery(`/testapp/api/v1/teacher/tests/${testId}/results/`);
        if (result.error) {
          return { error: result.error };
        }

        const rowsRaw = Array.isArray(result.data) ? (result.data as BackendTeacherResult[]) : [];
        const rows = rowsRaw.map((row) => {
          const score = normalizeNumber(row.score, 0);
          const percentage = normalizeNumber(row.percentage, 0);
          const inferredMax = percentage > 0 ? (score * 100) / percentage : score;
          const maxScore = normalizeNumber(row.max_score, Number.NaN);

          return {
            attemptId: row.attempt_id,
            studentName: row.student_name ?? "Unknown",
            score,
            maxScore: Number.isFinite(maxScore)
              ? maxScore
              : Number.isFinite(inferredMax)
                ? Number(inferredMax.toFixed(2))
                : score,
            percentage,
            passed: percentage >= 60,
            submittedAt: row.completed_at ?? null,
          };
        });

        const totalAttempts = rows.length;
        const averageScore =
          totalAttempts > 0
            ? rows.reduce((sum, row) => sum + row.percentage, 0) / totalAttempts
            : 0;
        const passRate =
          totalAttempts > 0
            ? (rows.filter((row) => row.passed).length / totalAttempts) * 100
            : 0;

        return {
          data: {
            testId,
            testTitle: `Test ${testId}`,
            totalAttempts,
            averageScore,
            passRate,
            rows,
          },
        };
      },
      providesTags: (_result, _error, testId) => [{ type: "TeacherResults", id: testId }],
    }),

    getTeacherAttemptDetails: builder.query<TeacherAttemptDetail, number>({
      queryFn: async (attemptId, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery(`/testapp/teacher/attempt/${attemptId}/details/`);
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as TeacherAttemptDetail };
        }

        const result = await baseQuery(`/testapp/api/v1/teacher/attempts/${attemptId}/details/`);
        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as BackendTeacherAttemptDetail;
        const questionsRaw = Array.isArray(data.questions) ? data.questions : [];

        return {
          data: {
            attemptId: normalizeNumber(data.attempt_id, attemptId),
            testId: normalizeNumber(data.test_id, 0),
            testTitle: data.test_title ?? `Test ${normalizeNumber(data.test_id, 0)}`,
            studentId: normalizeNumber(data.student_id, 0),
            studentName: data.student_name ?? "Unknown",
            score: normalizeNumber(data.score, 0),
            maxScore: normalizeNumber(data.max_score, 0),
            percentage: normalizeNumber(data.percentage, 0),
            startedAt: data.started_at ?? new Date().toISOString(),
            completedAt: data.completed_at ?? null,
            questions: questionsRaw.map((question) => ({
              questionId: normalizeNumber(question.question_id, 0),
              prompt: question.prompt ?? "",
              questionType: parseQuestionType(question.question_type),
              score: normalizeNumber(question.score, 0),
              maxScore: normalizeNumber(question.max_score, 0),
              writtenAnswer: question.written_answer ?? "",
              selectedAnswers: Array.isArray(question.selected_answers)
                ? question.selected_answers.map((answer) => ({
                    id: normalizeNumber(answer.id, 0),
                    text: String(answer.text ?? ""),
                  }))
                : [],
              correctAnswers: Array.isArray(question.correct_answers)
                ? question.correct_answers.map((answer) => ({
                    id: normalizeNumber(answer.id, 0),
                    text: String(answer.text ?? ""),
                  }))
                : [],
            })),
          },
        };
      },
      providesTags: (_result, _error, attemptId) => [{ type: "Attempt", id: attemptId }],
    }),

    getCourses: builder.query<Course[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery("/school/courses/");
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as Course[] };
        }

        const result = await baseQuery("/school/courses/");
        if (result.error) {
          return { error: result.error };
        }

        const rows = Array.isArray(result.data) ? (result.data as Array<Record<string, unknown>>) : [];
        return {
          data: rows.map((row) => ({
            id: normalizeNumber(row.id, 0),
            name: String(row.title ?? row.name ?? `Course ${row.id ?? ""}`),
          })),
        };
      },
      providesTags: ["Courses"],
    }),

    getEnrollment: builder.query<Enrollment[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (appEnv.useMockData) {
          const mockResult = await baseQuery("/school/enrollment/");
          if (mockResult.error) {
            return { error: mockResult.error };
          }

          return { data: mockResult.data as Enrollment[] };
        }

        const result = await baseQuery("/school/enrollment/");
        if (result.error) {
          return { error: result.error };
        }

        const rows = Array.isArray(result.data) ? (result.data as Array<Record<string, unknown>>) : [];
        return {
          data: rows.map((row) => ({
            id: normalizeNumber(row.id, 0),
            courseId: normalizeNumber(row.course, 0),
            courseName: String(row.course_title ?? row.course_name ?? `Course ${row.course ?? ""}`),
            studentId: normalizeNumber(row.student, 0),
            studentName: String(row.student_name ?? `Student ${row.student ?? ""}`),
          })),
        };
      },
      providesTags: ["Enrollment"],
    }),
  }),
});

export const {
  useLoginWithTelegramMutation,
  useLoginWithCredentialsMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetStudentTestsQuery,
  useStartStudentTestMutation,
  useSubmitStudentAttemptMutation,
  useGetStudentAttemptResultQuery,
  useGetTeacherTestsQuery,
  useGetTeacherTestQuery,
  useCreateTeacherTestMutation,
  useUpdateTeacherTestMutation,
  useDeleteTeacherTestMutation,
  useCreateTeacherQuestionMutation,
  useUpdateTeacherQuestionMutation,
  useDeleteTeacherQuestionMutation,
  useGetTeacherTestResultsQuery,
  useGetTeacherAttemptDetailsQuery,
  useGetCoursesQuery,
  useGetEnrollmentQuery,
} = api;
