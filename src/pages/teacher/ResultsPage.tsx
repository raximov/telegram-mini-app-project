import { useNavigate, useParams } from "react-router-dom";
import { useGetTeacherTestResultsQuery } from "@/store/api/api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export const TeacherResultsPage = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const parsedTestId = Number(testId);

  const { data, isLoading, isError, error, refetch } = useGetTeacherTestResultsQuery(parsedTestId, {
    skip: !Number.isFinite(parsedTestId),
  });

  if (!Number.isFinite(parsedTestId)) {
    return <ErrorState message="Invalid test id." onRetry={() => navigate("/teacher/tests")} />;
  }

  if (isLoading) {
    return <LoadingState label="Loading aggregated results..." />;
  }

  if (isError || !data) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to load results.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>{data.testTitle}</h2>
            <p>Aggregated submissions</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(`/teacher/tests/${data.testId}`)}>
            Back to Builder
          </button>
        </div>

        <dl className="stats-grid">
          <div>
            <dt>Total Attempts</dt>
            <dd>{data.totalAttempts}</dd>
          </div>
          <div>
            <dt>Average Score</dt>
            <dd>{data.averageScore.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Pass Rate</dt>
            <dd>{data.passRate.toFixed(1)}%</dd>
          </div>
        </dl>
      </article>

      <article className="panel">
        <h3>Student Results</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Percent</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>No submissions yet.</td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={row.attemptId}>
                    <td>{row.studentName}</td>
                    <td>
                      {row.score}/{row.maxScore}
                    </td>
                    <td>{row.percentage.toFixed(1)}%</td>
                    <td>
                      <span className={`badge ${row.passed ? "success" : "error"}`}>
                        {row.passed ? "Passed" : "Failed"}
                      </span>
                    </td>
                    <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "In progress"}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => navigate(`/teacher/results/${parsedTestId}/attempt/${row.attemptId}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default TeacherResultsPage;
