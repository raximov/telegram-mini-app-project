import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { useGetStudentAttemptResultQuery } from "@/store/api/api";

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const StudentResultPage = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const parsedAttemptId = Number(attemptId);

  const { data, isLoading, isError, error, refetch } = useGetStudentAttemptResultQuery(parsedAttemptId, {
    skip: !Number.isFinite(parsedAttemptId),
  });

  if (!Number.isFinite(parsedAttemptId)) {
    return <ErrorState message="Invalid attempt id." onRetry={() => navigate("/student")} />;
  }

  if (isLoading) {
    return <LoadingState label="Loading result..." />;
  }

  if (isError || !data) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Result could not be loaded.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>{data.testTitle}</h2>
            <p>Attempt #{data.attemptId}</p>
          </div>
          <span className={`badge ${data.passed ? "success" : "error"}`}>{data.passed ? "Passed" : "Failed"}</span>
        </div>

        <dl className="stats-grid">
          <div>
            <dt>Score</dt>
            <dd>
              {data.score} / {data.maxScore}
            </dd>
          </div>
          <div>
            <dt>Percent</dt>
            <dd>{formatPercent(data.percentage)}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{new Date(data.submittedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </article>

      <article className="panel">
        <h3>Question Review</h3>
        <div className="result-list">
          {data.breakdown.map((row, index) => (
            <div key={row.questionId} className={`result-item ${row.correct ? "ok" : "bad"}`}>
              <p className="muted">Q{index + 1}</p>
              <h4>{row.prompt}</h4>
              <p>
                <strong>Your answer:</strong> {row.userAnswerText}
              </p>
              <p>
                <strong>Expected:</strong> {row.correctAnswerText}
              </p>
              <p>
                <strong>Score:</strong> {row.pointsEarned}/{row.pointsMax}
              </p>
              <p className="muted">{row.explanation}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="actions-row">
        <button type="button" className="btn btn-secondary" onClick={() => navigate("/student/tests")}>
          Back to Tests
        </button>
      </div>
    </section>
  );
};

export default StudentResultPage;
