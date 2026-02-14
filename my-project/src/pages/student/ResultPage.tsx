/**
 * Student Result Page
 * Display detailed test results with question-by-question review
 */

'use client';

import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttemptResult, useTelegramBackButton, useHapticFeedback } from '@/hooks';
import { useAttemptStore } from '@/store';
import { QuestionRenderer } from '@/components/questions';
import { LoadingPage, ErrorDisplay, StatusBadge } from '@/components/common';
import { formatDistanceToNow, format } from 'date-fns';

export function StudentResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { currentAttempt } = useAttemptStore();

  const { data: result, isLoading, error } = useAttemptResult(parseInt(attemptId!, 10));

  // Handle back button
  useTelegramBackButton(() => {
    navigate('/student');
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!result) return null;

    const attempt = 'attempt' in result ? result.attempt : result;
    const detailedResults = 'detailed_results' in result ? result.detailed_results : [];

    const correctCount = detailedResults.filter((r) => r.is_correct).length;
    const totalQuestions = detailedResults.length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      totalQuestions,
      accuracy,
      timeSpent: attempt.time_spent || 0,
      score: attempt.score || 0,
      maxScore: attempt.max_score || 0,
      percentage: attempt.percentage || 0,
      passed: attempt.passed,
    };
  }, [result]);

  // Get attempt and questions
  const attempt = useMemo(() => {
    if (!result) return null;
    return 'attempt' in result ? result.attempt : result;
  }, [result]);

  const detailedResults = useMemo(() => {
    if (!result || !('detailed_results' in result)) return [];
    return result.detailed_results || [];
  }, [result]);

  // Loading state
  if (isLoading) {
    return <LoadingPage message="Loading results..." />;
  }

  if (error || !result || !attempt) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title="Failed to load results"
          message={(error as Error)?.message || 'Results not found'}
          onBack={() => navigate('/student')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Test Results</h1>
            <p className="text-xs text-muted-foreground">
              {attempt.test_title || 'Test'}
            </p>
          </div>
        </div>
      </header>

      {/* Score Card */}
      <div className="p-4">
        <Card className={stats?.passed ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Result icon */}
              <div
                className={`p-4 rounded-full mb-4 ${
                  stats?.passed
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {stats?.passed ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-500" />
                )}
              </div>

              {/* Pass/Fail status */}
              <Badge
                variant={stats?.passed ? 'default' : 'destructive'}
                className="text-sm mb-4"
              >
                {stats?.passed ? 'PASSED' : 'NOT PASSED'}
              </Badge>

              {/* Score */}
              <div className="mb-4">
                <span className="text-5xl font-bold">{stats?.score}</span>
                <span className="text-2xl text-muted-foreground">/{stats?.maxScore}</span>
              </div>

              {/* Percentage */}
              <div className="w-full max-w-xs mb-4">
                <Progress value={stats?.percentage || 0} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {stats?.percentage?.toFixed(1)}% Score
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-semibold">{stats?.correctCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span className="font-semibold">{stats?.incorrectCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">
                      {Math.floor((stats?.timeSpent || 0) / 60)}m
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Review */}
      <div className="px-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex-1">
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Performance breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <span className="font-medium">{stats?.accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions</span>
                  <span className="font-medium">
                    {stats?.correctCount}/{stats?.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Spent</span>
                  <span className="font-medium">
                    {Math.floor((stats?.timeSpent || 0) / 60)}m {(stats?.timeSpent || 0) % 60}s
                  </span>
                </div>
                {attempt.submitted_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <span className="font-medium text-xs">
                      {formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/student')}
              >
                Back to Tests
              </Button>
              <Button className="flex-1">Share Result</Button>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="mt-4 space-y-4">
            {detailedResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No detailed results available
                </CardContent>
              </Card>
            ) : (
              detailedResults.map((result, index) => (
                <QuestionRenderer
                  key={result.question.id}
                  question={result.question}
                  questionNumber={index + 1}
                  answer={result.user_answer}
                  onAnswer={() => {}}
                  disabled
                  showCorrect
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default StudentResultPage;
