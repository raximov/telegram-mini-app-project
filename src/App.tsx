import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ToastViewport } from "@/components/common/ToastViewport";
import { LoadingState } from "@/components/common/LoadingState";

const HomePage = lazy(() => import("@/pages/HomePage"));
const StudentDashboardPage = lazy(() => import("@/pages/student/DashboardPage"));
const StudentTestPage = lazy(() => import("@/pages/student/TestPage"));
const StudentResultPage = lazy(() => import("@/pages/student/ResultPage"));
const TeacherDashboardPage = lazy(() => import("@/pages/teacher/DashboardPage"));
const TeacherTestsPage = lazy(() => import("@/pages/teacher/TestsPage"));
const TeacherBuilderPage = lazy(() => import("@/pages/teacher/BuilderPage"));
const TeacherResultsPage = lazy(() => import("@/pages/teacher/ResultsPage"));
const TeacherAttemptDetailsPage = lazy(() => import("@/pages/teacher/AttemptDetailsPage"));

export const App = () => {
  useSessionBootstrap();

  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<LoadingState label="Loading route..." />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/student"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/tests"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/test/:id"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentTestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result/:attemptId"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/tests"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherTestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/tests/create"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/tests/:id"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/results/:testId"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/results/:testId/attempt/:attemptId"
              element={
                <ProtectedRoute allowRoles={["teacher"]}>
                  <TeacherAttemptDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
      <ToastViewport />
    </BrowserRouter>
  );
};

export default App;
