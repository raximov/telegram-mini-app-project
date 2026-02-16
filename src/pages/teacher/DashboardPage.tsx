import { Link } from "react-router-dom";
import { useGetTeacherTestsQuery } from "@/store/api/api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export const TeacherDashboardPage = () => {
  const { data, isLoading, isError, error, refetch } = useGetTeacherTestsQuery();

  if (isLoading) {
    return <LoadingState label="Loading teacher dashboard..." />;
  }

  if (isError) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to load tests.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  const tests = data ?? [];
  const published = tests.filter((test) => test.status === "published").length;
  const drafts = tests.filter((test) => test.status === "draft").length;
  const archived = tests.filter((test) => test.status === "archived").length;

  return (
    <section className="page-stack">
      <article className="panel">
        <h2>Teacher Dashboard</h2>
        <p>Manage tests, questions, and grading analytics.</p>

        <dl className="stats-grid">
          <div>
            <dt>Total Tests</dt>
            <dd>{tests.length}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{published}</dd>
          </div>
          <div>
            <dt>Drafts</dt>
            <dd>{drafts}</dd>
          </div>
          <div>
            <dt>Archived</dt>
            <dd>{archived}</dd>
          </div>
        </dl>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Quick Actions</h3>
          <div className="actions-row left">
            <Link to="/teacher/assignments" className="btn btn-secondary">
              Manage Assignments
            </Link>
            <Link to="/teacher/tests/create" className="btn btn-primary">
              Create Test
            </Link>
          </div>
        </div>

        <div className="card-grid">
          {tests.slice(0, 3).map((test) => (
            <div className="test-card" key={test.id}>
              <div className="test-head">
                <h4>{test.title}</h4>
                <span className={`badge ${test.status}`}>{test.status}</span>
              </div>
              <p>{test.description}</p>
              <div className="actions-row left">
                <Link to={`/teacher/tests/${test.id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <Link to={`/teacher/results/${test.id}`} className="btn btn-ghost">
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default TeacherDashboardPage;
