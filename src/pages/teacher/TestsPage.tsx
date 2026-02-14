import { Link } from "react-router-dom";
import { useDeleteTeacherTestMutation, useGetTeacherTestsQuery } from "@/store/api/api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export const TeacherTestsPage = () => {
  const { data, isLoading, isError, error, refetch } = useGetTeacherTestsQuery();
  const [deleteTest, deleteState] = useDeleteTeacherTestMutation();

  if (isLoading) {
    return <LoadingState label="Loading tests..." />;
  }

  if (isError) {
    const detail = (error as { data?: { detail?: string } })?.data?.detail ?? "Failed to load teacher tests.";
    return <ErrorState message={detail} onRetry={refetch} />;
  }

  const tests = data ?? [];

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <h2>All Tests</h2>
          <Link to="/teacher/tests/create" className="btn btn-primary">
            New Test
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>
                    <strong>{test.title}</strong>
                    <div className="muted">{test.description}</div>
                  </td>
                  <td>
                    <span className={`badge ${test.status}`}>{test.status}</span>
                  </td>
                  <td>{test.questions.length}</td>
                  <td>
                    <div className="actions-row left">
                      <Link className="btn btn-secondary" to={`/teacher/tests/${test.id}`}>
                        Edit
                      </Link>
                      <Link className="btn btn-ghost" to={`/teacher/results/${test.id}`}>
                        Results
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={deleteState.isLoading}
                        onClick={async () => {
                          if (!window.confirm("Delete this test?")) {
                            return;
                          }

                          await deleteTest(test.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default TeacherTestsPage;
