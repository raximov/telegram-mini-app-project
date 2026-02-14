import type { AttemptAnswerInput, StudentQuestion } from "@/types/domain";

interface QuestionRendererProps {
  question: StudentQuestion;
  value: AttemptAnswerInput | undefined;
  disabled?: boolean;
  onChange: (next: AttemptAnswerInput) => void;
}

const checked = (array: number[] | undefined, value: number): boolean => {
  return Array.isArray(array) ? array.includes(value) : false;
};

export const QuestionRenderer = ({ question, value, disabled = false, onChange }: QuestionRendererProps) => {
  const selected = value?.selectedOptionIds ?? [];

  if (question.type === "single") {
    return (
      <div className="question-body">
        {question.options.map((option) => (
          <label key={option.id} className="choice-item">
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={selected[0] === option.id}
              onChange={() =>
                onChange({
                  questionId: question.id,
                  selectedOptionIds: [option.id],
                })
              }
              disabled={disabled}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple") {
    return (
      <div className="question-body">
        {question.options.map((option) => (
          <label key={option.id} className="choice-item">
            <input
              type="checkbox"
              checked={checked(selected, option.id)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((item) => item !== option.id);

                onChange({
                  questionId: question.id,
                  selectedOptionIds: next,
                });
              }}
              disabled={disabled}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "short") {
    return (
      <textarea
        className="answer-input"
        value={value?.textAnswer ?? ""}
        onChange={(event) =>
          onChange({
            questionId: question.id,
            textAnswer: event.target.value,
          })
        }
        rows={5}
        placeholder="Write your answer"
        disabled={disabled}
      />
    );
  }

  return (
    <input
      className="answer-input"
      type="number"
      value={typeof value?.numericAnswer === "number" ? String(value.numericAnswer) : ""}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw.trim() === "") {
          onChange({
            questionId: question.id,
            numericAnswer: undefined,
          });
          return;
        }

        const numeric = Number(raw);
        onChange({
          questionId: question.id,
          numericAnswer: Number.isFinite(numeric) ? numeric : undefined,
        });
      }}
      placeholder="Enter numeric answer"
      disabled={disabled}
    />
  );
};
