import { Link, useNavigate } from "react-router-dom";
import { useGetStudentTestsQuery } from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedTestId, setStudentFilter } from "@/store/slices/testSlice";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const filter = useAppSelector((state) => state.test.studentFilter);
  const { data, isLoading, isError, error, refetch } = useGetStudentTestsQuery();

  if (isLoading) {
    return <LoadingState label="Loading available tests..." />;
  }

  if (isError) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to fetch student tests.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  const tests = data ?? [];
  const filtered = filter === "all" ? tests : tests.filter((test) => test.status === filter);

  return (
    <section className="page-stack">
      <div className="panel panel-tight">
        <h2>My Tests</h2>
        <p>Take published tests and submit before timeout.</p>

        <div className="pill-row">
          <button
            type="button"
            className={`pill ${filter === "all" ? "active" : ""}`}
            onClick={() => dispatch(setStudentFilter("all"))}
          >
            All
          </button>
          <button
            type="button"
            className={`pill ${filter === "open" ? "active" : ""}`}
            onClick={() => dispatch(setStudentFilter("open"))}
          >
            Open
          </button>
          <button
            type="button"
            className={`pill ${filter === "completed" ? "active" : ""}`}
            onClick={() => dispatch(setStudentFilter("completed"))}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="card-grid">
        {filtered.map((test) => (
          <article key={test.id} className="test-card">
            <div className="test-head">
              <h3>{test.title}</h3>
              <span className={`badge ${test.status}`}>{test.status}</span>
            </div>

            <p>{test.description}</p>

            <dl>
              <div>
                <dt>Questions</dt>
                <dd>{test.questionCount}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{Math.ceil(test.timeLimitSec / 60)} min</dd>
              </div>
            </dl>

            <div className="actions-row left">
              <button
                type="button"
                className="btn btn-primary"
                disabled={test.status === "completed"}
                onClick={() => {
                  dispatch(setSelectedTestId(test.id));
                  navigate(`/student/test/${test.id}`);
                }}
              >
                {test.status === "completed" ? "Submitted" : "Start Test"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel">
          <p>No tests match this filter.</p>
          <Link to="/student/tests" className="btn btn-secondary">
            Reset
          </Link>
        </div>
      ) : null}
    </section>
  );
};

export default StudentDashboardPage;
