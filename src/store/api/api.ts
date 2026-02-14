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
  AuthSession,
  Course,
  Enrollment,
  Role,
  StartAttemptResponse,
  StudentTestSummary,
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

const rawBaseQuery = fetchBaseQuery({
  baseUrl: appEnv.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as AuthStateShape;
    const token = state.auth.token;

    if (token) {
      headers.set("Authorization", `Token ${token}`);
    }

    headers.set("Content-Type", "application/json");
    return headers;
  },
  timeout: appEnv.requestTimeoutMs,
});

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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
    loginWithTelegram: builder.mutation<AuthSession, { initData: string; roleHint?: Role }>({
      query: (body) => ({
        url: "/school/login/",
        method: "POST",
        body,
      }),
    }),
    loginWithCredentials: builder.mutation<AuthSession, { username: string; password: string; roleHint?: Role }>({
      query: (body) => ({
        url: "/api-token-auth/",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<{ success: true }, void>({
      query: () => ({
        url: "/school/logout/",
        method: "POST",
      }),
    }),
    getProfile: builder.query<UserProfile, void>({
      query: () => "/school/profile/",
      providesTags: ["Profile"],
    }),

    getStudentTests: builder.query<StudentTestSummary[], void>({
      query: () => "/testapp/api/v1/student/tests/",
      providesTags: ["StudentTests"],
    }),
    startStudentTest: builder.mutation<StartAttemptResponse, { testId: number }>({
      query: ({ testId }) => ({
        url: `/testapp/api/v1/student/tests/${testId}/start/`,
        method: "POST",
      }),
      invalidatesTags: ["StudentTests", "Attempt"],
    }),
    submitStudentAttempt: builder.mutation<AttemptResult, { attemptId: number; answers: AttemptAnswerInput[] }>({
      query: ({ attemptId, answers }) => ({
        url: `/testapp/api/v1/student/attempts/${attemptId}/submit/`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ["StudentTests", "Attempt"],
    }),
    getStudentAttemptResult: builder.query<AttemptResult, number>({
      query: (attemptId) => `/testapp/api/v1/student/attempts/${attemptId}/result/`,
      providesTags: (_result, _error, attemptId) => [{ type: "Attempt", id: attemptId }],
    }),

    getTeacherTests: builder.query<TeacherTest[], void>({
      query: () => "/testapp/teacher/tests/",
      providesTags: ["TeacherTests"],
    }),
    getTeacherTest: builder.query<TeacherTest, number>({
      query: (testId) => `/testapp/teacher/tests/${testId}/`,
      providesTags: (_result, _error, testId) => [{ type: "TeacherTests", id: testId }],
    }),
    createTeacherTest: builder.mutation<TeacherTest, Partial<TeacherTest>>({
      query: (payload) => ({
        url: "/testapp/teacher/tests/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["TeacherTests"],
    }),
    updateTeacherTest: builder.mutation<TeacherTest, { id: number; data: Partial<TeacherTest> }>({
      query: ({ id, data }) => ({
        url: `/testapp/teacher/tests/${id}/`,
        method: "PATCH",
        body: data,
      }),
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
      query: (payload) => ({
        url: "/testapp/teacher/questions/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["TeacherTests"],
    }),
    updateTeacherQuestion: builder.mutation<TeacherQuestion, { questionId: number; question: TeacherQuestionInput }>({
      query: ({ questionId, question }) => ({
        url: `/testapp/teacher/questions/${questionId}/`,
        method: "PATCH",
        body: question,
      }),
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
      query: (testId) => `/testapp/teacher/test/${testId}/results/`,
      providesTags: (_result, _error, testId) => [{ type: "TeacherResults", id: testId }],
    }),

    getCourses: builder.query<Course[], void>({
      query: () => "/school/courses/",
      providesTags: ["Courses"],
    }),
    getEnrollment: builder.query<Enrollment[], void>({
      query: () => "/school/enrollment/",
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
  useGetCoursesQuery,
  useGetEnrollmentQuery,
} = api;
