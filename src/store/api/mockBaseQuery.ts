import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  createCourse,
  createEnrollment,
  createEnrollmentTest,
  getTeacherAttemptDetails,
  createTeacherQuestion,
  createTeacherTest,
  deleteEnrollmentTest,
  deleteTeacherQuestion,
  deleteTeacherTest,
  getProfile,
  getStudentAttemptResult,
  getTeacherResults,
  getTeacherTest,
  listEnrollmentTests,
  listCourses,
  listEnrollment,
  listStudents,
  listStudentTests,
  listTeacherTests,
  loginMockUser,
  logoutMockUser,
  startStudentAttempt,
  submitStudentAttempt,
  updateTeacherQuestion,
  updateTeacherTest,
} from "@/store/api/mockDb";
import type { TeacherQuestionInput } from "@/types/domain";

interface MockResult<T> {
  data?: T;
  error?: FetchBaseQueryError;
}

interface NormalizedRequest {
  url: string;
  method: string;
  body: unknown;
}

const toFetchError = (status: number, detail: string): FetchBaseQueryError => ({
  status,
  data: { detail },
});

const mapDomainError = (error: unknown): FetchBaseQueryError => {
  const code = error instanceof Error ? error.message : "UNKNOWN";

  switch (code) {
    case "UNAUTHORIZED":
      return toFetchError(401, "Authentication required.");
    case "NOT_FOUND":
      return toFetchError(404, "Requested resource was not found.");
    case "TEST_ALREADY_COMPLETED":
      return toFetchError(409, "You already submitted this test.");
    case "ATTEMPT_ALREADY_SUBMITTED":
      return toFetchError(409, "Attempt was already submitted.");
    case "ATTEMPT_EXPIRED":
      return toFetchError(409, "Attempt timed out.");
    case "RESULT_NOT_READY":
      return toFetchError(409, "Result is not available yet.");
    default:
      return toFetchError(500, "Unexpected mock server error.");
  }
};

const parseBody = (body: unknown): unknown => {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
};

const normalizeArgs = (args: string | FetchArgs): NormalizedRequest => {
  if (typeof args === "string") {
    return {
      url: args,
      method: "GET",
      body: undefined,
    };
  }

  return {
    url: args.url,
    method: (args.method ?? "GET").toUpperCase(),
    body: parseBody(args.body),
  };
};

const isMatch = (value: string, pattern: RegExp): RegExpMatchArray | null => value.match(pattern);

export const runMockRequest = async (
  args: string | FetchArgs,
  authToken: string | null
): Promise<MockResult<unknown>> => {
  const request = normalizeArgs(args);

  try {
    if (request.url === "/api-token-auth/" && request.method === "POST") {
      const body = (request.body ?? {}) as { username?: string; roleHint?: "student" | "teacher" };
      return { data: loginMockUser(body) };
    }

    if (request.url === "/school/login/" && request.method === "POST") {
      const body = (request.body ?? {}) as { roleHint?: "student" | "teacher" };
      return { data: loginMockUser({ roleHint: body.roleHint }) };
    }

    if (request.url === "/school/logout/" && request.method === "POST") {
      return { data: logoutMockUser(authToken) };
    }

    if (request.url === "/school/profile/" && request.method === "GET") {
      return { data: getProfile(authToken) };
    }

    if (request.url === "/testapp/api/v1/student/tests/" && request.method === "GET") {
      return { data: listStudentTests(authToken) };
    }

    const startMatch = isMatch(request.url, /^\/testapp\/api\/v1\/student\/tests\/(\d+)\/start\/?$/);
    if (startMatch && request.method === "POST") {
      return { data: startStudentAttempt(authToken, Number(startMatch[1])) };
    }

    const submitMatch = isMatch(request.url, /^\/testapp\/api\/v1\/student\/attempts\/(\d+)\/submit\/?$/);
    if (submitMatch && request.method === "POST") {
      const body = (request.body ?? {}) as { answers?: unknown };
      const answers = Array.isArray(body.answers) ? body.answers : [];
      return { data: submitStudentAttempt(authToken, Number(submitMatch[1]), answers) };
    }

    const resultMatch = isMatch(request.url, /^\/testapp\/api\/v1\/student\/attempts\/(\d+)\/result\/?$/);
    if (resultMatch && request.method === "GET") {
      return { data: getStudentAttemptResult(authToken, Number(resultMatch[1])) };
    }

    if (request.url === "/testapp/teacher/tests/" && request.method === "GET") {
      return { data: listTeacherTests(authToken) };
    }

    if (request.url === "/testapp/teacher/tests/" && request.method === "POST") {
      return { data: createTeacherTest(authToken, (request.body ?? {}) as Record<string, unknown>) };
    }

    const teacherTestMatch = isMatch(request.url, /^\/testapp\/teacher\/tests\/(\d+)\/?$/);
    if (teacherTestMatch && request.method === "GET") {
      return { data: getTeacherTest(authToken, Number(teacherTestMatch[1])) };
    }

    if (teacherTestMatch && request.method === "PATCH") {
      return {
        data: updateTeacherTest(
          authToken,
          Number(teacherTestMatch[1]),
          (request.body ?? {}) as Record<string, unknown>
        ),
      };
    }

    if (teacherTestMatch && request.method === "DELETE") {
      return { data: deleteTeacherTest(authToken, Number(teacherTestMatch[1])) };
    }

    if (request.url === "/testapp/teacher/questions/" && request.method === "POST") {
      const body = (request.body ?? {}) as { testId: number; question: TeacherQuestionInput };
      return { data: createTeacherQuestion(authToken, Number(body.testId), body.question) };
    }

    const questionMatch = isMatch(request.url, /^\/testapp\/teacher\/questions\/(\d+)\/?$/);
    if (questionMatch && request.method === "PATCH") {
      return {
        data: updateTeacherQuestion(
          authToken,
          Number(questionMatch[1]),
          (request.body ?? {}) as TeacherQuestionInput
        ),
      };
    }

    if (questionMatch && request.method === "DELETE") {
      return { data: deleteTeacherQuestion(authToken, Number(questionMatch[1])) };
    }

    const teacherResultMatch = isMatch(request.url, /^\/testapp\/teacher\/test\/(\d+)\/results\/?$/);
    if (teacherResultMatch && request.method === "GET") {
      return { data: getTeacherResults(authToken, Number(teacherResultMatch[1])) };
    }

    const teacherAttemptDetailMatch = isMatch(request.url, /^\/testapp\/teacher\/attempt\/(\d+)\/details\/?$/);
    if (teacherAttemptDetailMatch && request.method === "GET") {
      return { data: getTeacherAttemptDetails(authToken, Number(teacherAttemptDetailMatch[1])) };
    }

    if (request.url === "/school/courses/" && request.method === "GET") {
      return { data: listCourses(authToken) };
    }

    if (request.url === "/school/courses/" && request.method === "POST") {
      return { data: createCourse(authToken, (request.body ?? {}) as { title?: string }) };
    }

    if (request.url === "/school/enrollment/" && request.method === "GET") {
      return { data: listEnrollment(authToken) };
    }

    if (request.url === "/school/enrollment/" && request.method === "POST") {
      return {
        data: createEnrollment(
          authToken,
          (request.body ?? {}) as { student?: number; course?: number }
        ),
      };
    }

    if (request.url === "/school/students/" && request.method === "GET") {
      return { data: listStudents(authToken) };
    }

    if (request.url === "/testapp/teacher/enrollment/" && request.method === "GET") {
      return { data: listEnrollmentTests(authToken) };
    }

    if (request.url === "/testapp/teacher/enrollment/" && request.method === "POST") {
      return {
        data: createEnrollmentTest(
          authToken,
          (request.body ?? {}) as { course_id?: number; test_id?: number; attempt_count?: number }
        ),
      };
    }

    const enrollmentTestMatch = isMatch(request.url, /^\/testapp\/teacher\/enrollment\/(\d+)\/?$/);
    if (enrollmentTestMatch && request.method === "DELETE") {
      return { data: deleteEnrollmentTest(authToken, Number(enrollmentTestMatch[1])) };
    }

    return {
      error: toFetchError(404, `Mock route not implemented: ${request.method} ${request.url}`),
    };
  } catch (error) {
    return { error: mapDomainError(error) };
  }
};
