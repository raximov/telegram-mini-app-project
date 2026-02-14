/**
 * Student Question Components
 * Components for test taking experience
 */

import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// Question Navigation Component
// ============================================

interface QuestionNavProps {
  questions: Array<{ id: number }>;
  answers: Record<number, { selected_answers?: number[]; text_answer?: string; numeric_answer?: number }>;
  currentQuestion: number;
  onNavigate: (index: number) => void;
}

export function QuestionNav({ questions, answers, currentQuestion, onNavigate }: QuestionNavProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {questions.map((question, index) => {
        const answer = answers[question.id];
        const isAnswered =
          answer?.selected_answers?.length ||
          answer?.text_answer ||
          answer?.numeric_answer !== undefined;

        return (
          <button
            key={question.id}
            onClick={() => onNavigate(index)}
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-lg text-sm font-medium transition-all',
              index === currentQuestion
                ? 'bg-primary text-primary-foreground'
                : isAnswered
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Test Summary Card Component
// ============================================

interface TestSummaryCardProps {
  title: string;
  totalQuestions: number;
  answeredQuestions: number;
  timeSpent: number;
  timeLimit?: number;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function TestSummaryCard({
  title,
  totalQuestions,
  answeredQuestions,
  timeSpent,
  timeLimit,
  onSubmit,
  isSubmitting = false,
}: TestSummaryCardProps) {
  const unansweredCount = totalQuestions - answeredQuestions;
  const progress = (answeredQuestions / totalQuestions) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Test Summary</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {answeredQuestions}/{totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Warnings */}
        {unansweredCount > 0 && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
            <p className="text-sm font-medium">
              ⚠️ {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
            </p>
          </div>
        )}

        {/* Time spent */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test'}
        </Button>
      </CardFooter>
    </Card>
  );
}
