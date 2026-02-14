import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { useGetTeacherAttemptDetailsQuery } from "@/store/api/api";
import type { TeacherAttemptQuestionDetail } from "@/types/domain";

const formatOptions = (question: TeacherAttemptQuestionDetail): string => {
  if (question.selectedAnswers.length > 0) {
    return question.selectedAnswers.map((item) => item.text).join(", ");
  }

  if (question.writtenAnswer.trim().length > 0) {
    return question.writtenAnswer;
  }

  return "No answer";
};

const formatExpected = (question: TeacherAttemptQuestionDetail): string => {
  if (question.correctAnswers.length > 0) {
    return question.correctAnswers.map((item) => item.text).join(", ");
  }

  return "Not available";
};

export const TeacherAttemptDetailsPage = () => {
  const navigate = useNavigate();
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const parsedTestId = Number(testId);
  const parsedAttemptId = Number(attemptId);

  const { data, isLoading, isError, error, refetch } = useGetTeacherAttemptDetailsQuery(parsedAttemptId, {
    skip: !Number.isFinite(parsedAttemptId),
  });

  if (!Number.isFinite(parsedTestId) || !Number.isFinite(parsedAttemptId)) {
    return <ErrorState message="Invalid route parameters." onRetry={() => navigate("/teacher/tests")} />;
  }

  if (isLoading) {
    return <LoadingState label="Loading attempt details..." />;
  }

  if (isError || !data) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to load attempt details.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>{data.testTitle}</h2>
            <p>
              {data.studentName} | Attempt #{data.attemptId}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(`/teacher/results/${parsedTestId}`)}>
            Back to Results
          </button>
        </div>

        <dl className="stats-grid">
          <div>
            <dt>Score</dt>
            <dd>
              {data.score}/{data.maxScore}
            </dd>
          </div>
          <div>
            <dt>Percent</dt>
            <dd>{data.percentage.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{data.completedAt ? new Date(data.completedAt).toLocaleString() : "In progress"}</dd>
          </div>
        </dl>
      </article>

      <article className="panel">
        <h3>Question Details</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th>Score</th>
                <th>Student Answer</th>
                <th>Expected</th>
              </tr>
            </thead>
            <tbody>
              {data.questions.map((question, index) => (
                <tr key={question.questionId}>
                  <td>
                    <strong>Q{index + 1}</strong>
                    <div className="muted">{question.prompt}</div>
                  </td>
                  <td>{question.questionType}</td>
                  <td>
                    {question.score}/{question.maxScore}
                  </td>
                  <td>{formatOptions(question)}</td>
                  <td>{formatExpected(question)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default TeacherAttemptDetailsPage;
