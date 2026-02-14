/**
 * Student Test Taking Page
 * Updated to match the provided UI design with timer and progress
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Close,
  Timer,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  FormatListNumbered,
  Schedule,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  useStartTest,
  useSubmitAnswer,
  useSubmitAttempt,
  useTeacherTest,
  useTelegramBackButton,
  useHapticFeedback,
  useTimer,
} from '@/hooks';
import { useAttemptStore, useUIStore } from '@/store';
import { LoadingPage, ErrorDisplay, LoadingSpinner } from '@/components/common';
import { Question, SubmitAnswerRequest, QuestionType } from '@/types';

// Timer display component
function TimerDisplay({ timeRemaining }: { timeRemaining: number }) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 bg-[#137fec]/10 px-3 py-1.5 rounded-full">
      <Timer className="h-4 w-4 text-[#137fec]" />
      <span className="text-[#137fec] font-bold text-lg tabular-nums">{formatted}</span>
    </div>
  );
}

// Question type badge
function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const config: Record<QuestionType, { label: string; color: string }> = {
    SINGLE: { label: 'Multiple Choice', color: 'bg-[#137fec]/10 text-[#137fec]' },
    MULTIPLE: { label: 'Multiple Select', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    SHORT: { label: 'Short Answer', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    CALCULATION: { label: 'Calculation', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  };

  const { label, color } = config[type];

  return (
    <span className={`inline-block ${color} text-xs font-bold px-2 py-1 rounded mb-2`}>
      {label}
    </span>
  );
}

// Answer option component
function AnswerOption({
  value,
  selected,
  onSelect,
  children,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'group relative flex items-center p-4 cursor-pointer rounded-xl border-2',
        'bg-white dark:bg-[#15202b] shadow-sm overflow-hidden transition-all',
        selected
          ? 'border-[#137fec]'
          : 'border-transparent hover:border-[#137fec]/30'
      )}
    >
      <div className="absolute inset-0 bg-[#137fec] opacity-0 peer-checked:opacity-5 transition-opacity" />
      <div className="flex items-center gap-4 w-full z-10">
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            selected ? 'border-[#137fec] bg-[#137fec]' : 'border-slate-300 dark:border-slate-600'
          )}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
        </div>
        <span
          className={cn(
            'text-base font-medium',
            selected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
          )}
        >
          {children}
        </span>
      </div>
    </label>
  );
}

// Confirmation modal
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalCount,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  totalCount: number;
  isSubmitting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#15202b] w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#137fec]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#137fec]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submit Test?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            You have answered{' '}
            <span className="text-[#137fec] font-semibold">
              {answeredCount} of {totalCount}
            </span>{' '}
            questions. Once submitted, you cannot change your answers.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full bg-[#137fec] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#137fec]/20 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Test'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full bg-transparent text-slate-500 dark:text-slate-400 font-medium py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Review Answers
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { showToast, showConfirmModal, hideConfirmModal } = useUIStore();
  const { currentAttempt, answers, setCurrentAttempt, setAnswer, clearAttempt, setLoading, setError } =
    useAttemptStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch test details
  const { data: test, isLoading: testLoading, error: testError } = useTeacherTest(parseInt(testId!, 10));

  // Mutations
  const startTestMutation = useStartTest();
  const submitAnswerMutation = useSubmitAnswer();
  const submitAttemptMutation = useSubmitAttempt();

  // Initialize attempt on mount
  useEffect(() => {
    const initAttempt = async () => {
      if (testId && !currentAttempt) {
        try {
          setLoading(true);
          const attempt = await startTestMutation.mutateAsync(parseInt(testId, 10));
          setCurrentAttempt(attempt);
          setIsInitialized(true);
        } catch (error) {
          setError((error as Error).message);
          showToast({
            type: 'error',
            title: 'Failed to start test',
            message: (error as Error).message,
          });
          navigate('/student');
        } finally {
          setLoading(false);
        }
      } else if (currentAttempt) {
        setIsInitialized(true);
      }
    };

    initAttempt();
  }, [testId, currentAttempt]);

  // Timer setup
  const timeLimit = test?.time_limit ? test.time_limit * 60 : undefined;
  const handleTimeExpire = useCallback(() => {
    haptic.notification('warning');
    showToast({
      type: 'warning',
      title: 'Time is up!',
      message: 'Your test is being submitted automatically.',
    });
    handleSubmit();
  }, []);

  const timer = useTimer(timeLimit || 0, handleTimeExpire);

  // Start timer when initialized
  useEffect(() => {
    if (isInitialized && timeLimit) {
      timer.start();
    }
  }, [isInitialized, timeLimit]);

  // Handle back button
  useTelegramBackButton(() => {
    setShowSummary(true);
  }, [currentQuestionIndex]);

  // Current question
  const currentQuestion: Question | undefined = useMemo(() => {
    if (!test?.questions || test.questions.length === 0) return undefined;
    return test.questions[currentQuestionIndex];
  }, [test?.questions, currentQuestionIndex]);

  // Answer handling
  const handleAnswer = useCallback(
    async (answer: SubmitAnswerRequest) => {
      if (!currentAttempt) return;

      // Optimistic update
      setAnswer(answer.question_id, {
        question: answer.question_id,
        selected_answers: answer.selected_answers || [],
        text_answer: answer.text_answer,
        numeric_answer: answer.numeric_answer,
      } as any);

      haptic.selection();
    },
    [currentAttempt, setAnswer, haptic]
  );

  // Navigation
  const handleNext = useCallback(() => {
    if (test?.questions && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [test?.questions, currentQuestionIndex]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!currentAttempt) return;

    haptic.notification('success');

    try {
      await submitAttemptMutation.mutateAsync(currentAttempt.id);
      clearAttempt();
      navigate(`/student/result/${currentAttempt.id}`);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to submit test',
        message: 'Please try again.',
      });
    }
  }, [currentAttempt, submitAttemptMutation, clearAttempt, navigate, haptic, showToast]);

  // Loading states
  if (testLoading || !isInitialized) {
    return <LoadingPage message="Loading test..." />;
  }

  if (testError || !test) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title="Failed to load test"
          message={(testError as Error)?.message || 'Test not found'}
          onBack={() => navigate('/student')}
        />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = test.questions?.length || 0;
  const progress = totalCount > 0 ? ((currentQuestionIndex + 1) / totalCount) * 100 : 0;

  // Render question content
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.question_type) {
      case 'SINGLE':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 font-medium px-1">Select the best answer:</p>
            {currentQuestion.answers?.map((option) => (
              <AnswerOption
                key={option.id}
                value={option.id.toString()}
                selected={currentAnswer?.selected_answers?.[0] === option.id}
                onSelect={() =>
                  handleAnswer({
                    question_id: currentQuestion.id,
                    selected_answers: [option.id],
                  })
                }
              >
                {option.answer_text}
              </AnswerOption>
            ))}
          </div>
        );

      case 'MULTIPLE':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 font-medium px-1">Select all correct answers:</p>
            {currentQuestion.answers?.map((option) => {
              const isSelected = currentAnswer?.selected_answers?.includes(option.id) || false;
              return (
                <label
                  key={option.id}
                  className={cn(
                    'group relative flex items-center p-4 cursor-pointer rounded-xl border-2',
                    'bg-white dark:bg-[#15202b] shadow-sm overflow-hidden transition-all',
                    isSelected ? 'border-[#137fec]' : 'border-transparent hover:border-[#137fec]/30'
                  )}
                >
                  <div className="flex items-center gap-4 w-full z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const newSelected = checked
                          ? [...(currentAnswer?.selected_answers || []), option.id]
                          : (currentAnswer?.selected_answers || []).filter((id) => id !== option.id);
                        handleAnswer({
                          question_id: currentQuestion.id,
                          selected_answers: newSelected,
                        });
                      }}
                    />
                    <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                      {option.answer_text}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        );

      case 'SHORT':
        return (
          <div className="relative">
            <Textarea
              value={currentAnswer?.text_answer || ''}
              onChange={(e) =>
                handleAnswer({
                  question_id: currentQuestion.id,
                  text_answer: e.target.value,
                })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-3 focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-shadow resize-none h-32 text-base leading-relaxed"
              placeholder="Type your answer here..."
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
              {(currentAnswer?.text_answer || '').length}/500 chars
            </div>
          </div>
        );

      case 'CALCULATION':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 font-medium px-1">Enter your numeric answer:</p>
            <input
              type="number"
              step="any"
              value={currentAnswer?.numeric_answer ?? ''}
              onChange={(e) =>
                handleAnswer({
                  question_id: currentQuestion.id,
                  numeric_answer: parseFloat(e.target.value),
                })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-3 focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-shadow text-lg font-mono"
              placeholder="Enter number..."
            />
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unknown question type</p>;
    }
  };

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#101922] font-['Lexend',sans-serif] text-slate-800 dark:text-slate-200 h-screen flex flex-col overflow-hidden selection:bg-[#137fec]/20 selection:text-[#137fec]">
      {/* Top Navigation & Timer */}
      <header className="bg-white dark:bg-[#15202b] shadow-sm z-20 px-4 py-3 flex items-center justify-between shrink-0">
        <div
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer"
          onClick={() => navigate('/student')}
        >
          <Close className="h-5 w-5" />
          <span className="text-sm font-medium">Exit</span>
        </div>
        {timeLimit && <TimerDisplay timeRemaining={timer.timeRemaining} />}
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#15202b] px-4 pb-4 pt-1 shrink-0">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</span>
          <span className="text-sm font-semibold text-[#137fec]">
            Question {currentQuestionIndex + 1}{' '}
            <span className="text-slate-400 font-normal">/ {totalCount}</span>
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#137fec] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Question Card */}
          {currentQuestion && (
            <div className="bg-white dark:bg-[#15202b] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="mb-4">
                <QuestionTypeBadge type={currentQuestion.question_type} />
                <h2 className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-white">
                  {currentQuestion.question_text}
                </h2>
              </div>
            </div>
          )}

          {/* Answer Options */}
          {renderQuestionContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="bg-white/80 dark:bg-[#15202b]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 z-20 absolute bottom-0 w-full pb-8">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold active:scale-95 transition-transform hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <ArrowBack className="h-5 w-5" />
            <span>Previous</span>
          </button>

          {currentQuestionIndex === totalCount - 1 ? (
            <button
              onClick={() => setShowSummary(true)}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#137fec] text-white font-semibold shadow-lg shadow-[#137fec]/20 active:scale-95 transition-transform hover:bg-[#137fec]/90"
            >
              <span>Submit Test</span>
              <CheckCircle className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#137fec] text-white font-semibold shadow-lg shadow-[#137fec]/20 active:scale-95 transition-transform hover:bg-[#137fec]/90"
            >
              <span>Next Question</span>
              <ArrowForward className="h-5 w-5" />
            </button>
          )}
        </div>
      </footer>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onConfirm={handleSubmit}
        answeredCount={answeredCount}
        totalCount={totalCount}
        isSubmitting={submitAttemptMutation.isPending}
      />

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default StudentTestPage;
