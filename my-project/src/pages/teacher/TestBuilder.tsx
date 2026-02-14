/**
 * Teacher Test Builder Page
 * Create and edit tests with questions
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  Settings,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useTeacherTest,
  useCreateTest,
  useUpdateTest,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useTelegramBackButton,
  useHapticFeedback,
} from '@/hooks';
import { useTestStore, useUIStore } from '@/store';
import { TestForm, QuestionBuilder, QuestionList, ResultsTable } from '@/components/teacher';
import { LoadingPage, ErrorDisplay, LoadingSpinner } from '@/components/common';
import { Test, Question, QuestionType } from '@/types';

export function TeacherTestCreatePage() {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { showToast } = useUIStore();
  const createTestMutation = useCreateTest();

  const [testData, setTestData] = useState<Partial<Test>>({});
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useTelegramBackButton(() => {
    navigate('/teacher');
  });

  const handleSaveTest = async (data: Partial<Test>) => {
    setTestData(data);
  };

  const handleAddQuestion = () => {
    setShowQuestionBuilder(true);
  };

  const handleSaveQuestion = async (question: Partial<Question>) => {
    setQuestions([...questions, { ...question, id: Date.now() } as any]);
    setShowQuestionBuilder(false);
    haptic.notification('success');
    showToast({ type: 'success', title: 'Question added' });
  };

  const handleEditQuestion = (index: number) => {
    // TODO: Implement edit
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    haptic.selection();
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Create test first
      const test = await createTestMutation.mutateAsync({
        ...testData,
        status: 'DRAFT',
      });

      // Then create questions
      // This would need to be done via API calls

      haptic.notification('success');
      showToast({ type: 'success', title: 'Test saved as draft' });
      navigate(`/teacher/tests/${test.id}`);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to save test',
        message: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Create Test</h1>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {showQuestionBuilder ? (
          <QuestionBuilder
            onSave={handleSaveQuestion}
            onCancel={() => setShowQuestionBuilder(false)}
          />
        ) : (
          <>
            {/* Test Settings */}
            <TestForm
              onSave={handleSaveTest}
              onCancel={() => {}}
            />

            {/* Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Questions</CardTitle>
                    <CardDescription>
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No questions yet</p>
                    <p className="text-sm">Add questions to your test</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((question, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {question.question_text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {question.question_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {question.points} pts
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export function TeacherTestEditPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { showToast } = useUIStore();
  const { setCurrentTest } = useTestStore();

  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const {
    data: test,
    isLoading,
    error,
  } = useTeacherTest(parseInt(testId!, 10));

  const updateTestMutation = useUpdateTest();
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  useTelegramBackButton(() => {
    navigate('/teacher');
  });

  const handlePublishToggle = async () => {
    if (!test) return;

    try {
      await updateTestMutation.mutateAsync({
        testId: test.id,
        data: {
          status: test.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
        },
      });
      haptic.notification('success');
      showToast({
        type: 'success',
        title: test.status === 'PUBLISHED' ? 'Test unpublished' : 'Test published',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update test',
        message: (error as Error).message,
      });
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionBuilder(true);
  };

  const handleEditQuestion = (questionId: number) => {
    const question = test?.questions?.find((q) => q.id === questionId);
    if (question) {
      setEditingQuestion(question);
      setShowQuestionBuilder(true);
    }
  };

  const handleSaveQuestion = async (questionData: Partial<Question>) => {
    if (!test) return;

    try {
      if (editingQuestion) {
        await updateQuestionMutation.mutateAsync({
          questionId: editingQuestion.id,
          data: { ...questionData, test: test.id },
        });
      } else {
        await createQuestionMutation.mutateAsync({
          ...questionData,
          test: test.id,
        });
      }
      setShowQuestionBuilder(false);
      setEditingQuestion(null);
      haptic.notification('success');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to save question',
        message: (error as Error).message,
      });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      haptic.notification('success');
      showToast({ type: 'success', title: 'Question deleted' });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to delete question',
        message: (error as Error).message,
      });
    }
  };

  const handleDuplicateQuestion = async (questionId: number) => {
    const question = test?.questions?.find((q) => q.id === questionId);
    if (!question || !test) return;

    try {
      await createQuestionMutation.mutateAsync({
        ...question,
        id: undefined,
        question_text: `${question.question_text} (Copy)`,
        test: test.id,
      });
      haptic.notification('success');
      showToast({ type: 'success', title: 'Question duplicated' });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to duplicate question',
      });
    }
  };

  const handleReorderQuestions = async (questions: Question[]) => {
    // This would update the order via API
    // For now, we'll just show the UI
  };

  const handleViewResults = () => {
    navigate(`/teacher/results/${testId}`);
  };

  if (isLoading) {
    return <LoadingPage message="Loading test..." />;
  }

  if (error || !test) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title="Failed to load test"
          message={(error as Error)?.message || 'Test not found'}
          onBack={() => navigate('/teacher')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold">{test.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {test.questions?.length || 0} questions • {test.total_points} points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleViewResults}>
                <Eye className="h-4 w-4 mr-1" />
                Results
              </Button>
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Badge
                variant={test.status === 'PUBLISHED' ? 'default' : 'secondary'}
              >
                {test.status}
              </Badge>
              <span className="text-sm">
                {test.status === 'PUBLISHED' ? 'Visible to students' : 'Hidden from students'}
              </span>
            </div>
            <Switch
              checked={test.status === 'PUBLISHED'}
              onCheckedChange={handlePublishToggle}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {showQuestionBuilder ? (
          <QuestionBuilder
            question={editingQuestion || undefined}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setShowQuestionBuilder(false);
              setEditingQuestion(null);
            }}
            isSaving={createQuestionMutation.isPending || updateQuestionMutation.isPending}
          />
        ) : (
          <Tabs defaultValue="questions">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="questions" className="flex-1">
                Questions
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              {/* Add question button */}
              <Button onClick={handleAddQuestion} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>

              {/* Questions list */}
              <QuestionList
                questions={test.questions || []}
                onReorder={handleReorderQuestions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
              />
            </TabsContent>

            <TabsContent value="settings">
              <TestForm
                test={test}
                onSave={async (data) => {
                  try {
                    await updateTestMutation.mutateAsync({
                      testId: test.id,
                      data,
                    });
                    showToast({ type: 'success', title: 'Test updated' });
                  } catch (error) {
                    showToast({
                      type: 'error',
                      title: 'Failed to update test',
                    });
                  }
                }}
                onCancel={() => {}}
                isSaving={updateTestMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export function TeacherResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const { data: test, isLoading: testLoading } = useTeacherTest(parseInt(testId!, 10));
  // Note: useTestResults would need to be implemented with proper types

  useTelegramBackButton(() => {
    navigate(`/teacher/tests/${testId}`);
  });

  if (testLoading) {
    return <LoadingPage message="Loading results..." />;
  }

  // Mock results for display
  const mockResults = [
    {
      id: 1,
      student_name: 'John Doe',
      score: 85,
      max_score: 100,
      percentage: 85,
      passed: true,
      submitted_at: new Date().toISOString(),
      time_spent: 1800,
    },
    {
      id: 2,
      student_name: 'Jane Smith',
      score: 72,
      max_score: 100,
      percentage: 72,
      passed: true,
      submitted_at: new Date().toISOString(),
      time_spent: 2400,
    },
    {
      id: 3,
      student_name: 'Bob Wilson',
      score: 45,
      max_score: 100,
      percentage: 45,
      passed: false,
      submitted_at: new Date().toISOString(),
      time_spent: 1200,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/teacher/tests/${testId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Test Results</h1>
            <p className="text-xs text-muted-foreground">{test?.title}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Results</CardTitle>
            <CardDescription>
              {mockResults.length} submission{mockResults.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsTable
              results={mockResults}
              onViewDetails={(id) => {
                // Navigate to detailed result view
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TeacherTestCreatePage;
