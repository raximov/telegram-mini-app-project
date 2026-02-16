import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionRenderer } from "@/components/student/QuestionRenderer";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { useStartStudentTestMutation, useSubmitStudentAttemptMutation } from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAttempt, setAnswer, setAttemptError, setCurrentAttempt, setSubmitInFlight } from "@/store/slices/attemptSlice";

const formatSeconds = (value: number): string => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const parseErrorDetail = (error: unknown): string => {
  const typed = error as { data?: { detail?: string; invalid_questions?: string[] } };
  const detail = typed?.data?.detail;
  const invalid = typed?.data?.invalid_questions;

  if (Array.isArray(invalid) && invalid.length > 0) {
    return `${detail ?? "Test is invalid."} ${invalid.join(" ")}`;
  }

  return detail ?? "Operation failed.";
};

export const StudentTestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const testId = Number(id);

  const dispatch = useAppDispatch();
  const attemptState = useAppSelector((state) => state.attempt);

  const [startAttempt, startState] = useStartStudentTestMutation();
  const [submitAttempt] = useSubmitStudentAttemptMutation();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const autoSubmitRef = useRef(false);

  const activeSession = useMemo(() => {
    if (!attemptState.current) {
      return null;
    }

    return attemptState.current.test.id === testId ? attemptState.current : null;
  }, [attemptState.current, testId]);

  useEffect(() => {
    const setup = async (): Promise<void> => {
      if (!Number.isFinite(testId)) {
        navigate("/student", { replace: true });
        return;
      }

      if (activeSession) {
        return;
      }

      try {
        const response = await startAttempt({ testId }).unwrap();
        dispatch(setCurrentAttempt(response));
      } catch (error) {
        dispatch(setAttemptError(parseErrorDetail(error)));
      }
    };

    setup();
  }, [activeSession, dispatch, navigate, startAttempt, testId]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const question = activeSession?.test.questions[questionIndex];
  const totalQuestions = activeSession?.test.questions.length ?? 0;

  const expiresAtMs = activeSession ? new Date(activeSession.attempt.expiresAt).getTime() : 0;
  const timeLeftSec = Math.max(0, Math.floor((expiresAtMs - tick) / 1000));

  const submit = async (): Promise<void> => {
    if (!activeSession || attemptState.submitInFlight) {
      return;
    }

    dispatch(setSubmitInFlight(true));
    dispatch(setAttemptError(null));

    try {
      const answers = Object.values(attemptState.answersByQuestionId);
      const result = await submitAttempt({
        attemptId: activeSession.attempt.id,
        answers,
      }).unwrap();

      dispatch(clearAttempt());
      navigate(`/student/result/${result.attemptId}`);
    } catch (error) {
      dispatch(setAttemptError(parseErrorDetail(error)));
    } finally {
      dispatch(setSubmitInFlight(false));
    }
  };

  useEffect(() => {
    if (!activeSession || attemptState.submitInFlight || autoSubmitRef.current) {
      return;
    }

    if (timeLeftSec <= 0) {
      autoSubmitRef.current = true;
      submit();
    }
  }, [activeSession, attemptState.submitInFlight, timeLeftSec]);

  if (!activeSession && attemptState.error) {
    return <ErrorState message={attemptState.error} onRetry={() => navigate("/student/tests")} />;
  }

  if (startState.isLoading || !activeSession) {
    return <LoadingState label="Starting attempt..." />;
  }

  if (totalQuestions === 0) {
    return (
      <section className="page-stack">
        <article className="panel">
          <h2>{activeSession.test.title}</h2>
          <p>
            Backend API hozir student uchun savollar ro‘yxatini JSON ko‘rinishda qaytarmayapti.
            Shu sabab testni frontend ichida render qilib bo‘lmaydi.
          </p>
          <div className="actions-row left">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/student/tests")}>
              Back to Tests
            </button>
          </div>
        </article>
      </section>
    );
  }

  if (!question) {
    return <ErrorState message="Invalid test state: question was not found." onRetry={() => navigate("/student")} />;
  }

  const answerValue = attemptState.answersByQuestionId[question.id];

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>{activeSession.test.title}</h2>
            <p>{activeSession.test.description}</p>
          </div>
          <span className={`timer-chip ${timeLeftSec < 60 ? "danger" : ""}`}>{formatSeconds(timeLeftSec)}</span>
        </div>

        <div className="progress-row">
          <span>
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <span>{Math.round(((questionIndex + 1) / Math.max(1, totalQuestions)) * 100)}%</span>
        </div>
        <progress max={totalQuestions} value={questionIndex + 1} />
      </article>

      <article className="panel">
        <h3>{question.prompt}</h3>
        <p className="muted">Type: {question.type.toUpperCase()} | Points: {question.points}</p>

        <QuestionRenderer
          question={question}
          value={answerValue}
          onChange={(next) => dispatch(setAnswer(next))}
          disabled={attemptState.submitInFlight}
        />
      </article>

      {attemptState.error ? <ErrorState message={attemptState.error} /> : null}

      <div className="actions-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
          disabled={questionIndex === 0 || attemptState.submitInFlight}
        >
          Previous
        </button>

        {questionIndex < totalQuestions - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setQuestionIndex((current) => Math.min(totalQuestions - 1, current + 1))}
            disabled={attemptState.submitInFlight}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={attemptState.submitInFlight}
          >
            {attemptState.submitInFlight ? "Submitting..." : "Submit Attempt"}
          </button>
        )}
      </div>
    </section>
  );
};

export default StudentTestPage;
