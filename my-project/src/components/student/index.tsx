/**
 * Student Components
 * Components for student-facing functionality
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Award,
  PlayCircle,
  FileCheck,
  Calendar,
  ChevronRight,
  BookOpen,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Test, TestResult, Attempt, QuestionType } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

// ============================================
// Test Card Component
// ============================================

interface TestCardProps {
  test: Test;
  attempt?: Attempt;
  onStart?: () => void;
  onViewResults?: () => void;
  userRole?: 'student' | 'teacher';
}

export function TestCard({ test, attempt, onStart, onViewResults, userRole = 'student' }: TestCardProps) {
  const navigate = useNavigate();

  const statusConfig = useMemo(() => {
    switch (test.status) {
      case 'PUBLISHED':
        return { label: 'Published', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'DRAFT':
        return { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
      case 'ARCHIVED':
        return { label: 'Archived', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      default:
        return { label: test.status, color: 'bg-gray-100 text-gray-800' };
    }
  }, [test.status]);

  const questionTypeCount = useMemo(() => {
    const counts: Record<QuestionType, number> = {
      SINGLE: 0,
      MULTIPLE: 0,
      SHORT: 0,
      CALCULATION: 0,
    };
    test.questions?.forEach((q) => {
      counts[q.question_type]++;
    });
    return counts;
  }, [test.questions]);

  const isExpired = test.ends_at && new Date(test.ends_at) < new Date();
  const isNotStarted = test.starts_at && new Date(test.starts_at) > new Date();
  const canStart = !isExpired && !isNotStarted && test.status === 'PUBLISHED';

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{test.title}</CardTitle>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            {test.course_name && (
              <CardDescription className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {test.course_name}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {test.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>
        )}

        {/* Test metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{test.questions?.length || 0} questions</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>{test.total_points} points</span>
          </div>
          {test.time_limit && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{test.time_limit} min</span>
            </div>
          )}
          {test.passing_score && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileCheck className="h-4 w-4" />
              <span>Pass: {test.passing_score}%</span>
            </div>
          )}
        </div>

        {/* Question types summary */}
        {test.questions && test.questions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {questionTypeCount.SINGLE > 0 && (
              <Badge variant="outline" className="text-xs">Single: {questionTypeCount.SINGLE}</Badge>
            )}
            {questionTypeCount.MULTIPLE > 0 && (
              <Badge variant="outline" className="text-xs">Multiple: {questionTypeCount.MULTIPLE}</Badge>
            )}
            {questionTypeCount.SHORT > 0 && (
              <Badge variant="outline" className="text-xs">Short: {questionTypeCount.SHORT}</Badge>
            )}
            {questionTypeCount.CALCULATION > 0 && (
              <Badge variant="outline" className="text-xs">Calc: {questionTypeCount.CALCULATION}</Badge>
            )}
          </div>
        )}

        {/* Time constraints */}
        {(test.starts_at || test.ends_at) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {test.starts_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Starts: {format(new Date(test.starts_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {test.ends_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Ends: {format(new Date(test.ends_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>
        )}

        {/* Attempt status */}
        {attempt && (
          <div className="pt-3 border-t">
            <AttemptStatus attempt={attempt} />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        {userRole === 'student' && (
          <>
            {attempt?.status === 'IN_PROGRESS' && (
              <Button onClick={onStart} className="flex-1">
                Continue Test
              </Button>
            )}
            {(!attempt || attempt.status === 'NOT_STARTED') && canStart && (
              <Button onClick={onStart} className="flex-1">
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Test
              </Button>
            )}
            {attempt?.status === 'SUBMITTED' && (
              <Button variant="outline" onClick={onViewResults} className="flex-1">
                View Results
              </Button>
            )}
            {isNotStarted && (
              <Button disabled className="flex-1">
                Not Started Yet
              </Button>
            )}
            {isExpired && (
              <Button disabled className="flex-1">
                Expired
              </Button>
            )}
          </>
        )}
        {userRole === 'teacher' && (
          <>
            <Button variant="outline" onClick={() => navigate(`/teacher/tests/${test.id}`)}>
              Edit
            </Button>
            <Button onClick={onViewResults}>
              <Users className="h-4 w-4 mr-2" />
              Results
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================
// Attempt Status Component
// ============================================

interface AttemptStatusProps {
  attempt: Attempt;
  compact?: boolean;
}

export function AttemptStatus({ attempt, compact = false }: AttemptStatusProps) {
  const statusConfig = useMemo(() => {
    switch (attempt.status) {
      case 'NOT_STARTED':
        return { label: 'Not Started', color: 'text-gray-500', icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'text-blue-500', icon: PlayCircle };
      case 'SUBMITTED':
        return { label: 'Submitted', color: 'text-yellow-500', icon: FileCheck };
      case 'GRADED':
        return { label: 'Graded', color: 'text-green-500', icon: Award };
      case 'EXPIRED':
        return { label: 'Expired', color: 'text-red-500', icon: Clock };
      default:
        return { label: attempt.status, color: 'text-gray-500', icon: Clock };
    }
  }, [attempt.status]);

  const Icon = statusConfig.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', statusConfig.color)}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{statusConfig.label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-2', statusConfig.color)}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusConfig.label}</span>
        </div>
        {attempt.score !== undefined && (
          <span className="text-sm font-semibold">
            {attempt.score}/{attempt.max_score}
          </span>
        )}
      </div>
      {attempt.status === 'IN_PROGRESS' && attempt.expires_at && (
        <div className="text-xs text-muted-foreground">
          Expires {formatDistanceToNow(new Date(attempt.expires_at), { addSuffix: true })}
        </div>
      )}
      {attempt.status === 'GRADED' && attempt.passed !== undefined && (
        <Badge variant={attempt.passed ? 'default' : 'destructive'} className="text-xs">
          {attempt.passed ? 'Passed' : 'Failed'}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// Result Card Component
// ============================================

interface ResultCardProps {
  result: TestResult | Attempt;
  testTitle?: string;
  onViewDetails?: () => void;
}

export function ResultCard({ result, testTitle, onViewDetails }: ResultCardProps) {
  const attempt = 'attempt' in result ? result.attempt : result;
  const score = 'score' in result ? result.score : attempt.score;
  const maxScore = 'max_score' in result ? result.max_score : attempt.max_score;
  const percentage = 'percentage' in result ? result.percentage : attempt.percentage;
  const passed = 'passed' in result ? result.passed : attempt.passed;

  const scoreColor = useMemo(() => {
    if (!percentage) return 'text-gray-500';
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }, [percentage]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{testTitle || attempt.test_title}</CardTitle>
            <CardDescription>
              {attempt.submitted_at
                ? `Submitted ${formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true })}`
                : 'In progress'}
            </CardDescription>
          </div>
          {passed !== undefined && (
            <Badge variant={passed ? 'default' : 'destructive'}>
              {passed ? 'Passed' : 'Failed'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Score</span>
          <div className="text-right">
            <span className={cn('text-2xl font-bold', scoreColor)}>
              {score !== undefined ? score : '-'}
            </span>
            {maxScore !== undefined && (
              <span className="text-muted-foreground">/{maxScore}</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {percentage !== undefined && (
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}%</p>
          </div>
        )}

        {/* Time spent */}
        {attempt.time_spent && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Time: {Math.floor(attempt.time_spent / 60)}m {attempt.time_spent % 60}s</span>
          </div>
        )}
      </CardContent>

      {onViewDetails && (
        <CardFooter>
          <Button variant="outline" onClick={onViewDetails} className="w-full">
            View Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

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
// Test Summary Card
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
