import { useEffect, useMemo, useState } from "react";
import {
  useCreateCourseMutation,
  useCreateEnrollmentMutation,
  useCreateEnrollmentTestMutation,
  useDeleteEnrollmentTestMutation,
  useGetCoursesQuery,
  useGetEnrollmentQuery,
  useGetEnrollmentTestsQuery,
  useGetStudentsQuery,
  useGetTeacherTestsQuery,
} from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { pushToast } from "@/store/slices/uiSlice";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

const getErrorDetail = (error: unknown): string => {
  const typed = error as {
    data?: { detail?: string; error?: string };
    error?: string;
  };

  return typed?.data?.detail ?? typed?.data?.error ?? typed?.error ?? "Action failed.";
};

export const TeacherAssignmentsPage = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);

  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrObj,
    refetch: refetchCourses,
  } = useGetCoursesQuery();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsErrObj,
    refetch: refetchStudents,
  } = useGetStudentsQuery();
  const {
    data: testsData,
    isLoading: testsLoading,
    isError: testsError,
    error: testsErrObj,
    refetch: refetchTests,
  } = useGetTeacherTestsQuery();
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    error: assignmentsErrObj,
    refetch: refetchAssignments,
  } = useGetEnrollmentTestsQuery();
  const {
    data: enrollmentData,
    isLoading: enrollmentLoading,
    isError: enrollmentError,
    error: enrollmentErrObj,
    refetch: refetchEnrollment,
  } = useGetEnrollmentQuery();

  const [createCourse, createCourseState] = useCreateCourseMutation();
  const [createEnrollment, createEnrollmentState] = useCreateEnrollmentMutation();
  const [createEnrollmentTest, createEnrollmentTestState] = useCreateEnrollmentTestMutation();
  const [deleteEnrollmentTest, deleteEnrollmentTestState] = useDeleteEnrollmentTestMutation();

  const [courseTitle, setCourseTitle] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedEnrollmentCourseId, setSelectedEnrollmentCourseId] = useState<number>(0);
  const [selectedAssignCourseId, setSelectedAssignCourseId] = useState<number>(0);
  const [selectedAssignTestId, setSelectedAssignTestId] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(3);

  const courses = coursesData ?? [];
  const students = studentsData ?? [];
  const tests = testsData ?? [];
  const assignments = assignmentsData ?? [];
  const enrollmentRows = enrollmentData ?? [];

  const publishedTests = useMemo(() => tests.filter((test) => test.status === "published"), [tests]);

  useEffect(() => {
    if (students.length > 0 && selectedStudentId === 0) {
      setSelectedStudentId(students[0]!.id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (courses.length > 0 && selectedEnrollmentCourseId === 0) {
      setSelectedEnrollmentCourseId(courses[0]!.id);
    }
    if (courses.length > 0 && selectedAssignCourseId === 0) {
      setSelectedAssignCourseId(courses[0]!.id);
    }
  }, [courses, selectedEnrollmentCourseId, selectedAssignCourseId]);

  useEffect(() => {
    if (publishedTests.length > 0 && selectedAssignTestId === 0) {
      setSelectedAssignTestId(publishedTests[0]!.id);
    }
  }, [publishedTests, selectedAssignTestId]);

  if (coursesLoading || studentsLoading || testsLoading || assignmentsLoading || enrollmentLoading) {
    return <LoadingState label="Loading assignment workspace..." />;
  }

  if (coursesError || studentsError || testsError || assignmentsError || enrollmentError) {
    const firstError = [coursesErrObj, studentsErrObj, testsErrObj, assignmentsErrObj, enrollmentErrObj].find(Boolean);
    const detail = getErrorDetail(firstError);
    return (
      <ErrorState
        message={detail || "Failed to load assignment data."}
        onRetry={() => {
          void refetchCourses();
          void refetchStudents();
          void refetchTests();
          void refetchAssignments();
          void refetchEnrollment();
        }}
      />
    );
  }

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!profile || profile.role !== "teacher") {
      dispatch(pushToast({ type: "error", message: "Teacher profile is required." }));
      return;
    }

    const title = courseTitle.trim();
    if (!title) {
      dispatch(pushToast({ type: "warning", message: "Course title is required." }));
      return;
    }

    try {
      const created = await createCourse({ title, teacherId: profile.id }).unwrap();
      setCourseTitle("");
      dispatch(pushToast({ type: "success", message: `Course created: ${created.name}` }));
    } catch (error) {
      dispatch(pushToast({ type: "error", message: getErrorDetail(error) }));
    }
  };

  const handleEnrollStudent = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedStudentId || !selectedEnrollmentCourseId) {
      dispatch(pushToast({ type: "warning", message: "Select both student and course." }));
      return;
    }

    try {
      const created = await createEnrollment({
        studentId: selectedStudentId,
        courseId: selectedEnrollmentCourseId,
      }).unwrap();
      dispatch(
        pushToast({
          type: "success",
          message: `${created.studentName} enrolled to ${created.courseName}.`,
        })
      );
    } catch (error) {
      dispatch(pushToast({ type: "error", message: getErrorDetail(error) }));
    }
  };

  const handleAssignTest = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedAssignCourseId || !selectedAssignTestId) {
      dispatch(pushToast({ type: "warning", message: "Select both course and test." }));
      return;
    }

    try {
      const created = await createEnrollmentTest({
        courseId: selectedAssignCourseId,
        testId: selectedAssignTestId,
        attemptCount,
      }).unwrap();
      dispatch(
        pushToast({
          type: "success",
          message: `Assigned "${created.testTitle}" to ${created.courseName}.`,
        })
      );
    } catch (error) {
      dispatch(pushToast({ type: "error", message: getErrorDetail(error) }));
    }
  };

  return (
    <section className="page-stack">
      <article className="panel panel-tight">
        <h2>Assignments</h2>
        <p>Set up course access so students can see and take published tests.</p>
      </article>

      <article className="panel">
        <h3>Create Course</h3>
        <form className="field-grid" onSubmit={handleCreateCourse}>
          <label>
            <span>Course title</span>
            <input
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
              placeholder="e.g. Algebra Group A"
              required
            />
          </label>
          <div className="actions-row left">
            <button className="btn btn-primary" type="submit" disabled={createCourseState.isLoading}>
              {createCourseState.isLoading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </article>

      <article className="panel">
        <h3>Enroll Student to Course</h3>
        <form className="field-grid" onSubmit={handleEnrollStudent}>
          <label>
            <span>Student</span>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(Number(event.target.value))}
              required
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} (#{student.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Course</span>
            <select
              value={selectedEnrollmentCourseId}
              onChange={(event) => setSelectedEnrollmentCourseId(Number(event.target.value))}
              required
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} (#{course.id})
                </option>
              ))}
            </select>
          </label>
          <div className="actions-row left">
            <button className="btn btn-primary" type="submit" disabled={createEnrollmentState.isLoading}>
              {createEnrollmentState.isLoading ? "Saving..." : "Enroll Student"}
            </button>
          </div>
        </form>
      </article>

      <article className="panel">
        <h3>Assign Test to Course</h3>
        <form className="field-grid" onSubmit={handleAssignTest}>
          <label>
            <span>Course</span>
            <select
              value={selectedAssignCourseId}
              onChange={(event) => setSelectedAssignCourseId(Number(event.target.value))}
              required
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Published test</span>
            <select
              value={selectedAssignTestId}
              onChange={(event) => setSelectedAssignTestId(Number(event.target.value))}
              required
            >
              {publishedTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Attempt count</span>
            <input
              type="number"
              min={1}
              max={20}
              value={attemptCount}
              onChange={(event) => setAttemptCount(Number(event.target.value))}
            />
          </label>
          <div className="actions-row left">
            <button className="btn btn-primary" type="submit" disabled={createEnrollmentTestState.isLoading}>
              {createEnrollmentTestState.isLoading ? "Assigning..." : "Assign Test"}
            </button>
          </div>
        </form>
      </article>

      <article className="panel">
        <h3>Current Course-Test Assignments</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Test</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td>{item.courseName}</td>
                  <td>{item.testTitle}</td>
                  <td>{item.attemptCount}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={deleteEnrollmentTestState.isLoading}
                      onClick={async () => {
                        try {
                          await deleteEnrollmentTest(item.id).unwrap();
                          dispatch(pushToast({ type: "success", message: "Assignment deleted." }));
                        } catch (error) {
                          dispatch(pushToast({ type: "error", message: getErrorDetail(error) }));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <h3>Current Student Enrollment</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.studentName}</td>
                  <td>{row.courseName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default TeacherAssignmentsPage;
