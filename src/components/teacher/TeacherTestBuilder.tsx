import { useMemo, useState } from "react";
import type { QuestionType, TeacherQuestion, TeacherQuestionInput, TeacherTest, TestStatus } from "@/types/domain";

interface OptionDraft {
  localId: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDraft {
  localId: string;
  id?: number;
  prompt: string;
  type: QuestionType;
  points: number;
  options: OptionDraft[];
  correctText: string;
  correctNumber: string;
  tolerance: string;
  explanation: string;
}

export interface BuilderSubmitPayload {
  test: Partial<TeacherTest>;
  questions: QuestionDraft[];
  deletedQuestionIds: number[];
}

interface TeacherTestBuilderProps {
  initialTest?: TeacherTest;
  submitting: boolean;
  onSubmit: (payload: BuilderSubmitPayload) => Promise<void> | void;
}

const formatSubmitError = (error: unknown): string => {
  const typed = error as {
    data?: { detail?: string; error?: string } | string;
    status?: number | string;
    originalStatus?: number;
    error?: string;
  };

  if (typeof typed?.data === "object" && typed.data !== null) {
    const detail = typed.data.detail ?? typed.data.error;
    if (detail) {
      return detail;
    }
  }

  if (typeof typed?.data === "string" && typed.data.trim().startsWith("<")) {
    const statusHint =
      typed?.status === "PARSING_ERROR" && typeof typed?.originalStatus === "number"
        ? ` (HTTP ${typed.originalStatus})`
        : "";
    return `Backend JSON o'rniga HTML qaytardi${statusHint}. API URL va backend loglarini tekshiring.`;
  }

  if (typeof typed?.error === "string" && typed.error.trim().length > 0) {
    return typed.error;
  }

  return "Failed to save test.";
};

const randomId = (): string => Math.random().toString(36).slice(2, 10);

const toQuestionDraft = (question: TeacherQuestion): QuestionDraft => ({
  localId: randomId(),
  id: question.id,
  prompt: question.prompt,
  type: question.type,
  points: question.points,
  options: question.options.map((option) => ({
    localId: randomId(),
    text: option.text,
    isCorrect: question.correctOptionIds.includes(option.id),
  })),
  correctText: question.correctText ?? "",
  correctNumber: question.correctNumber === null ? "" : String(question.correctNumber),
  tolerance: question.tolerance === null ? "" : String(question.tolerance),
  explanation: question.explanation,
});

const createEmptyQuestion = (): QuestionDraft => ({
  localId: randomId(),
  prompt: "",
  type: "single",
  points: 1,
  options: [
    { localId: randomId(), text: "", isCorrect: false },
    { localId: randomId(), text: "", isCorrect: false },
  ],
  correctText: "",
  correctNumber: "",
  tolerance: "",
  explanation: "",
});

export const toQuestionInput = (draft: QuestionDraft): TeacherQuestionInput => {
  const options = draft.options.map((option) => ({
    text: option.text,
    isCorrect: option.isCorrect,
  }));

  const base: TeacherQuestionInput = {
    prompt: draft.prompt,
    type: draft.type,
    points: draft.points,
    options,
    explanation: draft.explanation,
  };

  if (draft.type === "short") {
    base.correctText = draft.correctText;
  }

  if (draft.type === "numeric") {
    const parsed = Number(draft.correctNumber);
    base.correctNumber = Number.isFinite(parsed) ? parsed : null;

    const tolerance = Number(draft.tolerance);
    base.tolerance = Number.isFinite(tolerance) ? tolerance : 0;
  }

  return base;
};

export const TeacherTestBuilder = ({ initialTest, submitting, onSubmit }: TeacherTestBuilderProps) => {
  const [title, setTitle] = useState(initialTest?.title ?? "");
  const [description, setDescription] = useState(initialTest?.description ?? "");
  const [status, setStatus] = useState<TestStatus>(initialTest?.status ?? "draft");
  const [timeLimitSec, setTimeLimitSec] = useState(initialTest?.timeLimitSec ?? 900);
  const [passingPercent, setPassingPercent] = useState(initialTest?.passingPercent ?? 60);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialTest ? initialTest.questions.map(toQuestionDraft) : [createEmptyQuestion()]
  );
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<number[]>([]);

  const totalPoints = useMemo(
    () => questions.reduce((sum, question) => sum + Math.max(0, question.points || 0), 0),
    [questions]
  );

  const patchQuestion = (localId: string, updater: (current: QuestionDraft) => QuestionDraft): void => {
    setQuestions((current) => current.map((question) => (question.localId === localId ? updater(question) : question)));
  };

  const addQuestion = (): void => {
    setQuestions((current) => [...current, createEmptyQuestion()]);
  };

  const removeQuestion = (localId: string): void => {
    setQuestions((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target?.id) {
        setDeletedQuestionIds((ids) => [...ids, target.id!]);
      }
      return current.filter((item) => item.localId !== localId);
    });
  };

  const addOption = (questionId: string): void => {
    patchQuestion(questionId, (question) => ({
      ...question,
      options: [...question.options, { localId: randomId(), text: "", isCorrect: false }],
    }));
  };

  const removeOption = (questionId: string, optionId: string): void => {
    patchQuestion(questionId, (question) => ({
      ...question,
      options: question.options.filter((option) => option.localId !== optionId),
    }));
  };

  const setSingleCorrect = (questionId: string, optionId: string): void => {
    patchQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) => ({
        ...option,
        isCorrect: option.localId === optionId,
      })),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await onSubmit({
        test: {
          title,
          description,
          status,
          timeLimitSec,
          passingPercent,
        },
        questions,
        deletedQuestionIds,
      });
    } catch (error) {
      setSubmitError(formatSubmitError(error));
    }
  };

  return (
    <form className="builder-form" onSubmit={handleSubmit}>
      <section className="panel">
        <h2>Test Settings</h2>
        <div className="field-grid">
          <label>
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TestStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            <span>Time Limit (seconds)</span>
            <input
              type="number"
              min={30}
              value={timeLimitSec}
              onChange={(event) => setTimeLimitSec(Number(event.target.value))}
            />
          </label>

          <label>
            <span>Passing Percent</span>
            <input
              type="number"
              min={1}
              max={100}
              value={passingPercent}
              onChange={(event) => setPassingPercent(Number(event.target.value))}
            />
          </label>
        </div>

        <label>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="What this test covers"
          />
        </label>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Questions</h2>
          <button type="button" className="btn btn-secondary" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        <p className="muted">Total points: {totalPoints}</p>

        <div className="question-list">
          {questions.map((question, index) => (
            <article className="question-card" key={question.localId}>
              <div className="question-head">
                <h3>Question {index + 1}</h3>
                <button type="button" className="btn btn-ghost" onClick={() => removeQuestion(question.localId)}>
                  Remove
                </button>
              </div>

              <label>
                <span>Prompt</span>
                <textarea
                  value={question.prompt}
                  onChange={(event) =>
                    patchQuestion(question.localId, (item) => ({ ...item, prompt: event.target.value }))
                  }
                  rows={2}
                  required
                />
              </label>

              <div className="field-grid">
                <label>
                  <span>Type</span>
                  <select
                    value={question.type}
                    onChange={(event) =>
                      patchQuestion(question.localId, (item) => ({
                        ...item,
                        type: event.target.value as QuestionType,
                      }))
                    }
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                    <option value="short">Short Answer</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </label>

                <label>
                  <span>Points</span>
                  <input
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(event) =>
                      patchQuestion(question.localId, (item) => ({
                        ...item,
                        points: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              {(question.type === "single" || question.type === "multiple") && (
                <div className="options-block">
                  <div className="panel-header compact">
                    <h4>Options</h4>
                    <button type="button" className="btn btn-secondary" onClick={() => addOption(question.localId)}>
                      Add Option
                    </button>
                  </div>

                  {question.options.map((option) => (
                    <div className="option-row" key={option.localId}>
                      {question.type === "single" ? (
                        <input
                          type="radio"
                          checked={option.isCorrect}
                          onChange={() => setSingleCorrect(question.localId, option.localId)}
                          name={`single-${question.localId}`}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(event) =>
                            patchQuestion(question.localId, (item) => ({
                              ...item,
                              options: item.options.map((candidate) =>
                                candidate.localId === option.localId
                                  ? { ...candidate, isCorrect: event.target.checked }
                                  : candidate
                              ),
                            }))
                          }
                        />
                      )}

                      <input
                        value={option.text}
                        onChange={(event) =>
                          patchQuestion(question.localId, (item) => ({
                            ...item,
                            options: item.options.map((candidate) =>
                              candidate.localId === option.localId
                                ? { ...candidate, text: event.target.value }
                                : candidate
                            ),
                          }))
                        }
                        placeholder="Option text"
                        required
                      />

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeOption(question.localId, option.localId)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "short" && (
                <label>
                  <span>Correct Text</span>
                  <input
                    value={question.correctText}
                    onChange={(event) =>
                      patchQuestion(question.localId, (item) => ({ ...item, correctText: event.target.value }))
                    }
                    placeholder="Expected short answer"
                    required
                  />
                </label>
              )}

              {question.type === "numeric" && (
                <div className="field-grid">
                  <label>
                    <span>Correct Number</span>
                    <input
                      type="number"
                      step="any"
                      value={question.correctNumber}
                      onChange={(event) =>
                        patchQuestion(question.localId, (item) => ({ ...item, correctNumber: event.target.value }))
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Tolerance</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={question.tolerance}
                      onChange={(event) =>
                        patchQuestion(question.localId, (item) => ({ ...item, tolerance: event.target.value }))
                      }
                      placeholder="0"
                    />
                  </label>
                </div>
              )}

              <label>
                <span>Explanation</span>
                <textarea
                  value={question.explanation}
                  onChange={(event) =>
                    patchQuestion(question.localId, (item) => ({ ...item, explanation: event.target.value }))
                  }
                  rows={2}
                  placeholder="Shown to student after submission"
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      <div className="actions-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Test"}
        </button>
      </div>
      {submitError ? <p className="error-inline">{submitError}</p> : null}
    </form>
  );
};
