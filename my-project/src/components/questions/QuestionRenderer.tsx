/**
 * Question Renderer Components
 * Components for rendering different question types
 */

import React, { useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Calculator, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Question, Answer, AttemptAnswer, SubmitAnswerRequest, QuestionType } from '@/types';
import { useHapticFeedback } from '@/hooks';

// ============================================
// Base Question Component
// ============================================

interface QuestionContainerProps {
  question: Question;
  questionNumber: number;
  children: React.ReactNode;
  showResult?: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
  maxPoints?: number;
}

export function QuestionContainer({
  question,
  questionNumber,
  children,
  showResult = false,
  isCorrect,
  pointsEarned = 0,
  maxPoints = 0,
}: QuestionContainerProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        showResult && isCorrect && 'border-green-500 dark:border-green-400',
        showResult && !isCorrect && 'border-red-500 dark:border-red-400'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {questionNumber}
            </span>
            <div className="flex-1">
              <CardTitle className="text-base leading-relaxed">
                {question.question_text}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{question.points} points</Badge>
                <QuestionTypeBadge type={question.question_type} />
              </div>
            </div>
          </div>
          {showResult && (
            <div className="flex-shrink-0">
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
        {showResult && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points earned</span>
              <span className={cn('font-semibold', isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {pointsEarned} / {maxPoints}
              </span>
            </div>
            {question.explanation && (
              <div className="mt-3 p-3 rounded-md bg-muted">
                <p className="text-sm font-medium mb-1">Explanation:</p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Question Type Badge
// ============================================

interface QuestionTypeBadgeProps {
  type: QuestionType;
}

export function QuestionTypeBadge({ type }: QuestionTypeBadgeProps) {
  const config = {
    SINGLE: { label: 'Single Choice', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    MULTIPLE: { label: 'Multiple Choice', icon: CheckCircle2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    SHORT: { label: 'Short Answer', icon: MessageSquare, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    CALCULATION: { label: 'Calculation', icon: Calculator, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  };

  const { label, icon: Icon, color } = config[type];

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ============================================
// Single Choice Question
// ============================================

interface SingleChoiceQuestionProps {
  question: Question;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export function SingleChoiceQuestion({
  question,
  answer,
  onAnswer,
  disabled = false,
  showCorrect = false,
}: SingleChoiceQuestionProps) {
  const haptic = useHapticFeedback();

  const handleSelect = useCallback(
    (answerId: string) => {
      haptic.selection();
      onAnswer({
        question_id: question.id,
        selected_answers: [parseInt(answerId, 10)],
      });
    },
    [question.id, onAnswer, haptic]
  );

  const selectedAnswer = answer?.selected_answers?.[0];
  const correctAnswer = question.answers.find((a) => a.is_correct);

  return (
    <RadioGroup
      value={selectedAnswer?.toString()}
      onValueChange={handleSelect}
      disabled={disabled}
      className="space-y-2"
    >
      {question.answers.map((option) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.is_correct;
        const showCorrectStyle = showCorrect && isCorrect;
        const showIncorrectStyle = showCorrect && isSelected && !isCorrect;

        return (
          <div
            key={option.id}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200',
              'hover:bg-accent/50',
              isSelected && !showCorrect && 'border-primary bg-primary/5',
              showCorrectStyle && 'border-green-500 bg-green-50 dark:bg-green-900/20',
              showIncorrectStyle && 'border-red-500 bg-red-50 dark:bg-red-900/20',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <RadioGroupItem value={option.id.toString()} id={`q${question.id}-a${option.id}`} />
            <Label
              htmlFor={`q${question.id}-a${option.id}`}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.answer_text}
            </Label>
            {showCorrect && isCorrect && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {showCorrect && isSelected && !isCorrect && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      })}
    </RadioGroup>
  );
}

// ============================================
// Multiple Choice Question
// ============================================

interface MultipleChoiceQuestionProps {
  question: Question;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export function MultipleChoiceQuestion({
  question,
  answer,
  onAnswer,
  disabled = false,
  showCorrect = false,
}: MultipleChoiceQuestionProps) {
  const haptic = useHapticFeedback();
  const selectedAnswers = answer?.selected_answers || [];

  const handleToggle = useCallback(
    (answerId: number, checked: boolean) => {
      haptic.selection();
      const newSelected = checked
        ? [...selectedAnswers, answerId]
        : selectedAnswers.filter((id) => id !== answerId);

      onAnswer({
        question_id: question.id,
        selected_answers: newSelected,
      });
    },
    [question.id, selectedAnswers, onAnswer, haptic]
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">Select all correct answers</p>
      {question.answers.map((option) => {
        const isSelected = selectedAnswers.includes(option.id);
        const isCorrect = option.is_correct;
        const showCorrectStyle = showCorrect && isCorrect;
        const showIncorrectStyle = showCorrect && isSelected && !isCorrect;

        return (
          <div
            key={option.id}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200',
              'hover:bg-accent/50',
              isSelected && !showCorrect && 'border-primary bg-primary/5',
              showCorrectStyle && 'border-green-500 bg-green-50 dark:bg-green-900/20',
              showIncorrectStyle && 'border-red-500 bg-red-50 dark:bg-red-900/20',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <Checkbox
              id={`q${question.id}-a${option.id}`}
              checked={isSelected}
              onCheckedChange={(checked) => handleToggle(option.id, checked as boolean)}
              disabled={disabled}
            />
            <Label
              htmlFor={`q${question.id}-a${option.id}`}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.answer_text}
            </Label>
            {showCorrect && isCorrect && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {showCorrect && isSelected && !isCorrect && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Short Answer Question
// ============================================

interface ShortAnswerQuestionProps {
  question: Question;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export function ShortAnswerQuestion({
  question,
  answer,
  onAnswer,
  disabled = false,
  showCorrect = false,
}: ShortAnswerQuestionProps) {
  const correctAnswer = question.correct_answer;

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Type your answer here..."
        value={answer?.text_answer || ''}
        onChange={(e) =>
          onAnswer({
            question_id: question.id,
            text_answer: e.target.value,
          })
        }
        disabled={disabled}
        className="min-h-[100px] resize-none"
      />
      {showCorrect && correctAnswer && (
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium mb-1">Correct answer:</p>
          <p className="text-sm text-muted-foreground">{correctAnswer}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Calculation Question
// ============================================

interface CalculationQuestionProps {
  question: Question;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export function CalculationQuestion({
  question,
  answer,
  onAnswer,
  disabled = false,
  showCorrect = false,
}: CalculationQuestionProps) {
  const correctAnswer = question.answers.find((a) => a.is_correct);
  const tolerance = question.tolerance || 0.01;

  const handleInputChange = useCallback(
    (value: string) => {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        onAnswer({
          question_id: question.id,
          numeric_answer: numericValue,
        });
      }
    },
    [question.id, onAnswer]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Enter your answer"
          value={answer?.numeric_answer ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
      </div>
      {question.hint && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{question.hint}</p>
        </div>
      )}
      {showCorrect && correctAnswer && (
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium mb-1">Correct answer:</p>
          <p className="text-sm text-muted-foreground">{correctAnswer.answer_text}</p>
          <p className="text-xs text-muted-foreground mt-1">
            (Tolerance: ±{tolerance})
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Question Renderer
// ============================================

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  answer?: AttemptAnswer;
  onAnswer: (answer: SubmitAnswerRequest) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export function QuestionRenderer({
  question,
  questionNumber,
  answer,
  onAnswer,
  disabled = false,
  showCorrect = false,
}: QuestionRendererProps) {
  const renderQuestionContent = useMemo(() => {
    switch (question.question_type) {
      case 'SINGLE':
        return (
          <SingleChoiceQuestion
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            disabled={disabled}
            showCorrect={showCorrect}
          />
        );
      case 'MULTIPLE':
        return (
          <MultipleChoiceQuestion
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            disabled={disabled}
            showCorrect={showCorrect}
          />
        );
      case 'SHORT':
        return (
          <ShortAnswerQuestion
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            disabled={disabled}
            showCorrect={showCorrect}
          />
        );
      case 'CALCULATION':
        return (
          <CalculationQuestion
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            disabled={disabled}
            showCorrect={showCorrect}
          />
        );
      default:
        return <p className="text-muted-foreground">Unknown question type</p>;
    }
  }, [question, answer, onAnswer, disabled, showCorrect]);

  // Calculate if the answer is correct for result display
  const isCorrect = useMemo(() => {
    if (!showCorrect || !answer) return undefined;

    switch (question.question_type) {
      case 'SINGLE':
      case 'MULTIPLE':
        const correctAnswerIds = question.answers
          .filter((a) => a.is_correct)
          .map((a) => a.id);
        const selectedAnswerIds = answer.selected_answers || [];
        return (
          correctAnswerIds.length === selectedAnswerIds.length &&
          correctAnswerIds.every((id) => selectedAnswerIds.includes(id))
        );
      case 'SHORT':
        return answer.text_answer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      case 'CALCULATION':
        const correctNumeric = parseFloat(
          question.answers.find((a) => a.is_correct)?.answer_text || '0'
        );
        const tolerance = question.tolerance || 0.01;
        return Math.abs((answer.numeric_answer || 0) - correctNumeric) <= tolerance;
      default:
        return false;
    }
  }, [showCorrect, answer, question]);

  return (
    <QuestionContainer
      question={question}
      questionNumber={questionNumber}
      showResult={showCorrect}
      isCorrect={isCorrect}
      pointsEarned={isCorrect ? question.points : 0}
      maxPoints={question.points}
    >
      {renderQuestionContent}
    </QuestionContainer>
  );
}
