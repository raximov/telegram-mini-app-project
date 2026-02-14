import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateTeacherQuestionMutation,
  useCreateTeacherTestMutation,
  useDeleteTeacherQuestionMutation,
  useGetTeacherTestQuery,
  useUpdateTeacherQuestionMutation,
  useUpdateTeacherTestMutation,
} from "@/store/api/api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import {
  TeacherTestBuilder,
  type BuilderSubmitPayload,
  toQuestionInput,
} from "@/components/teacher/TeacherTestBuilder";

export const TeacherBuilderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const testId = id ? Number(id) : null;
  const editMode = Number.isFinite(testId) && testId !== null;

  const { data, isLoading, isError, error, refetch } = useGetTeacherTestQuery(testId as number, {
    skip: !editMode,
  });

  const [createTest, createTestState] = useCreateTeacherTestMutation();
  const [updateTest, updateTestState] = useUpdateTeacherTestMutation();
  const [createQuestion] = useCreateTeacherQuestionMutation();
  const [updateQuestion] = useUpdateTeacherQuestionMutation();
  const [deleteQuestion] = useDeleteTeacherQuestionMutation();

  const submitting = createTestState.isLoading || updateTestState.isLoading;

  const submitBuilderPayload = async (payload: BuilderSubmitPayload): Promise<void> => {
    if (!editMode) {
      const createdTest = await createTest(payload.test).unwrap();

      for (const question of payload.questions) {
        await createQuestion({
          testId: createdTest.id,
          question: toQuestionInput(question),
        }).unwrap();
      }

      navigate(`/teacher/tests/${createdTest.id}`);
      return;
    }

    const targetId = testId as number;
    await updateTest({ id: targetId, data: payload.test }).unwrap();

    for (const draft of payload.questions) {
      if (draft.id) {
        await updateQuestion({
          questionId: draft.id,
          question: toQuestionInput(draft),
        }).unwrap();
      } else {
        await createQuestion({
          testId: targetId,
          question: toQuestionInput(draft),
        }).unwrap();
      }
    }

    for (const questionId of payload.deletedQuestionIds) {
      await deleteQuestion(questionId).unwrap();
    }

    await refetch();
  };

  if (editMode && isLoading) {
    return <LoadingState label="Loading test builder..." />;
  }

  if (editMode && (isError || !data)) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to load test.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  return (
    <section className="page-stack">
      <article className="panel panel-tight">
        <h2>{editMode ? "Edit Test" : "Create Test"}</h2>
        <p>Configure scoring rules, answer keys, and publication state.</p>
      </article>

      <TeacherTestBuilder
        initialTest={editMode ? data : undefined}
        onSubmit={submitBuilderPayload}
        submitting={submitting}
      />
    </section>
  );
};

export default TeacherBuilderPage;
