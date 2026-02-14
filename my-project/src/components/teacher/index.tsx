/**
 * Teacher Components
 * Components for teacher-facing functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Save,
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Question, Answer, QuestionType, Test } from '@/types';
import { QuestionTypeBadge } from '@/components/questions/QuestionRenderer';

// ============================================
// Sortable Question Item
// ============================================

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableQuestionItem({
  question,
  index,
  onEdit,
  onDelete,
  onDuplicate,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Question number */}
      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        {index + 1}
      </span>

      {/* Question content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{question.question_text}</p>
        <div className="flex items-center gap-2 mt-1">
          <QuestionTypeBadge type={question.question_type} />
          <span className="text-xs text-muted-foreground">{question.points} pts</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplicate">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive" title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Question List Component
// ============================================

interface QuestionListProps {
  questions: Question[];
  onReorder: (questions: Question[]) => void;
  onEdit: (questionId: number) => void;
  onDelete: (questionId: number) => void;
  onDuplicate: (questionId: number) => void;
}

export function QuestionList({
  questions,
  onReorder,
  onEdit,
  onDelete,
  onDuplicate,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id.toString() === active.id);
      const newIndex = questions.findIndex((q) => q.id.toString() === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
        ...q,
        order: i,
      }));

      onReorder(newQuestions);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No questions yet. Add your first question to get started.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <SortableQuestionItem
              key={question.id}
              question={question}
              index={index}
              onEdit={() => onEdit(question.id)}
              onDelete={() => onDelete(question.id)}
              onDuplicate={() => onDuplicate(question.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ============================================
// Question Builder Component
// ============================================

interface QuestionBuilderProps {
  question?: Question;
  onSave: (question: Partial<Question>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function QuestionBuilder({ question, onSave, onCancel, isSaving = false }: QuestionBuilderProps) {
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [questionType, setQuestionType] = useState<QuestionType>(question?.question_type || 'SINGLE');
  const [points, setPoints] = useState(question?.points || 1);
  const [hint, setHint] = useState(question?.hint || '');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [tolerance, setTolerance] = useState(question?.tolerance || 0.01);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer || '');
  const [answers, setAnswers] = useState<Partial<Answer>[]>(
    question?.answers?.length
      ? question.answers.map((a) => ({ ...a }))
      : [{ answer_text: '', is_correct: true }, { answer_text: '', is_correct: false }]
  );

  const handleAddAnswer = () => {
    setAnswers([...answers, { answer_text: '', is_correct: false }]);
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  const handleCorrectAnswerChange = (index: number) => {
    if (questionType === 'SINGLE') {
      // For single choice, only one can be correct
      setAnswers(
        answers.map((a, i) => ({
          ...a,
          is_correct: i === index,
        }))
      );
    } else {
      // For multiple choice, toggle the clicked one
      handleAnswerChange(index, 'is_correct', !answers[index].is_correct);
    }
  };

  const handleSave = () => {
    const questionData: Partial<Question> = {
      question_text: questionText,
      question_type: questionType,
      points,
      hint: hint || undefined,
      explanation: explanation || undefined,
    };

    // Add type-specific fields
    if (questionType === 'CALCULATION') {
      questionData.tolerance = tolerance;
    }

    if (questionType === 'SHORT') {
      questionData.correct_answer = correctAnswer;
    }

    // Add answers for choice questions
    if (questionType === 'SINGLE' || questionType === 'MULTIPLE') {
      questionData.answers = answers.map((a, index) => ({
        answer_text: a.answer_text || '',
        is_correct: a.is_correct || false,
        order: index,
      }));
    }

    if (questionType === 'CALCULATION') {
      // For calculation, the first answer is the correct numeric value
      questionData.answers = [
        {
          answer_text: answers[0]?.answer_text || '0',
          is_correct: true,
          order: 0,
        },
      ];
    }

    onSave(questionData);
  };

  const isValid = useMemo(() => {
    if (!questionText.trim()) return false;

    if (questionType === 'SHORT') {
      return correctAnswer.trim().length > 0;
    }

    if (questionType === 'CALCULATION') {
      return !isNaN(parseFloat(answers[0]?.answer_text || ''));
    }

    // For choice questions, at least one answer must be correct and all must have text
    return (
      answers.every((a) => a.answer_text?.trim()) &&
      answers.some((a) => a.is_correct)
    );
  }, [questionText, questionType, answers, correctAnswer]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{question ? 'Edit Question' : 'New Question'}</CardTitle>
        <CardDescription>
          Create a question for your test
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question text */}
        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text *</Label>
          <Textarea
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here..."
            className="min-h-[100px]"
          />
        </div>

        {/* Question type */}
        <div className="space-y-2">
          <Label htmlFor="question-type">Question Type *</Label>
          <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
            <SelectTrigger id="question-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single Choice</SelectItem>
              <SelectItem value="MULTIPLE">Multiple Choice</SelectItem>
              <SelectItem value="SHORT">Short Answer</SelectItem>
              <SelectItem value="CALCULATION">Calculation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Points */}
        <div className="space-y-2">
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value, 10) || 1)}
            className="w-24"
          />
        </div>

        {/* Type-specific fields */}
        {(questionType === 'SINGLE' || questionType === 'MULTIPLE') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Answers *</Label>
              <Button variant="outline" size="sm" onClick={handleAddAnswer}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                  {questionType === 'SINGLE' ? (
                    <RadioGroup
                      value={answers.findIndex((a) => a.is_correct)?.toString()}
                      onValueChange={() => handleCorrectAnswerChange(index)}
                    >
                      <RadioGroupItem value={index.toString()} />
                    </RadioGroup>
                  ) : (
                    <Checkbox
                      checked={answer.is_correct}
                      onCheckedChange={() => handleCorrectAnswerChange(index)}
                    />
                  )}
                  <Input
                    value={answer.answer_text || ''}
                    onChange={(e) => handleAnswerChange(index, 'answer_text', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAnswer(index)}
                    disabled={answers.length <= 2}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'SHORT' && (
          <div className="space-y-2">
            <Label htmlFor="correct-answer">Correct Answer *</Label>
            <Input
              id="correct-answer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct answer"
            />
          </div>
        )}

        {questionType === 'CALCULATION' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="correct-value">Correct Value *</Label>
              <Input
                id="correct-value"
                type="number"
                step="any"
                value={answers[0]?.answer_text || ''}
                onChange={(e) =>
                  setAnswers([{ answer_text: e.target.value, is_correct: true }])
                }
                placeholder="Enter the correct numeric value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolerance (±)</Label>
              <Input
                id="tolerance"
                type="number"
                step="any"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
                placeholder="0.01"
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Answers within this range will be marked correct
              </p>
            </div>
          </>
        )}

        {/* Hint */}
        <div className="space-y-2">
          <Label htmlFor="hint">Hint (optional)</Label>
          <Input
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional hint for students"
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explanation (optional)</Label>
          <Textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explanation shown after submission"
            className="min-h-[80px]"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!isValid || isSaving}>
          {isSaving ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Question
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================
// Test Form Component
// ============================================

interface TestFormProps {
  test?: Test;
  onSave: (test: Partial<Test>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function TestForm({ test, onSave, onCancel, isSaving = false }: TestFormProps) {
  const [title, setTitle] = useState(test?.title || '');
  const [description, setDescription] = useState(test?.description || '');
  const [timeLimit, setTimeLimit] = useState(test?.time_limit?.toString() || '');
  const [passingScore, setPassingScore] = useState(test?.passing_score?.toString() || '');
  const [maxAttempts, setMaxAttempts] = useState(test?.max_attempts?.toString() || '');
  const [startsAt, setStartsAt] = useState(
    test?.starts_at ? new Date(test.starts_at).toISOString().slice(0, 16) : ''
  );
  const [endsAt, setEndsAt] = useState(
    test?.ends_at ? new Date(test.ends_at).toISOString().slice(0, 16) : ''
  );

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      time_limit: timeLimit ? parseInt(timeLimit, 10) : undefined,
      passing_score: passingScore ? parseFloat(passingScore) : undefined,
      max_attempts: maxAttempts ? parseInt(maxAttempts, 10) : undefined,
      starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
    });
  };

  const isValid = title.trim().length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{test ? 'Edit Test' : 'Create New Test'}</CardTitle>
        <CardDescription>
          {test ? 'Update test details' : 'Set up a new test for your students'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Test Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter test title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for students"
            className="min-h-[80px]"
          />
        </div>

        {/* Time limit */}
        <div className="space-y-2">
          <Label htmlFor="time-limit">Time Limit (minutes)</Label>
          <Input
            id="time-limit"
            type="number"
            min="1"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="Leave empty for no limit"
            className="w-40"
          />
        </div>

        {/* Passing score */}
        <div className="space-y-2">
          <Label htmlFor="passing-score">Passing Score (%)</Label>
          <Input
            id="passing-score"
            type="number"
            min="0"
            max="100"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            placeholder="e.g., 60"
            className="w-40"
          />
        </div>

        {/* Max attempts */}
        <div className="space-y-2">
          <Label htmlFor="max-attempts">Max Attempts</Label>
          <Input
            id="max-attempts"
            type="number"
            min="1"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            placeholder="Leave empty for unlimited"
            className="w-40"
          />
        </div>

        {/* Availability */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="starts-at">Starts At</Label>
            <Input
              id="starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends-at">Ends At</Label>
            <Input
              id="ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!isValid || isSaving}>
          {isSaving ? 'Saving...' : test ? 'Update Test' : 'Create Test'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================
// Results Table Component
// ============================================

interface ResultsTableProps {
  results: Array<{
    id: number;
    student_name: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    submitted_at: string;
    time_spent: number;
  }>;
  onViewDetails?: (resultId: number) => void;
}

export function ResultsTable({ results, onViewDetails }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No results yet. Results will appear here after students submit their tests.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Student</th>
            <th className="text-center py-3 px-4 font-medium">Score</th>
            <th className="text-center py-3 px-4 font-medium">Percentage</th>
            <th className="text-center py-3 px-4 font-medium">Status</th>
            <th className="text-center py-3 px-4 font-medium">Time</th>
            <th className="text-center py-3 px-4 font-medium">Submitted</th>
            {onViewDetails && <th className="text-right py-3 px-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">{result.student_name}</td>
              <td className="text-center py-3 px-4">
                {result.score}/{result.max_score}
              </td>
              <td className="text-center py-3 px-4">
                <span
                  className={cn(
                    'font-medium',
                    result.percentage >= 80
                      ? 'text-green-600'
                      : result.percentage >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  )}
                >
                  {result.percentage.toFixed(1)}%
                </span>
              </td>
              <td className="text-center py-3 px-4">
                <Badge variant={result.passed ? 'default' : 'destructive'}>
                  {result.passed ? 'Passed' : 'Failed'}
                </Badge>
              </td>
              <td className="text-center py-3 px-4">
                {Math.floor(result.time_spent / 60)}m {result.time_spent % 60}s
              </td>
              <td className="text-center py-3 px-4 text-muted-foreground">
                {new Date(result.submitted_at).toLocaleDateString()}
              </td>
              {onViewDetails && (
                <td className="text-right py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(result.id)}
                  >
                    View
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
