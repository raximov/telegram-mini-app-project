/**
 * Student Dashboard Page
 * Updated to match the provided UI design
 */

'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bolt,
  Quiz,
  Timer,
  Schedule,
  FormatListNumbered,
  ArrowForward,
  EmojiEvents,
  Person,
  Dashboard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudentTests, useProfile } from '@/hooks';
import { useUserStore } from '@/store';
import { LoadingCard, EmptyState } from '@/components/common';
import { Test, Attempt } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

// Mock student data
const MOCK_STUDENT = {
  name: 'Alex Johnson',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
};

// Priority test card
function PriorityTestCard({ test, onStart }: { test: Test & { attempt?: Attempt }; onStart: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-1">
            Due Today
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#137fec] transition-colors">
            {test.title}
          </h3>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#137fec]/10 flex items-center justify-center text-[#137fec]">
          <Quiz className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center">
          <FormatListNumbered className="h-4 w-4 mr-1" />
          <span>{test.questions?.length || 0} Qs</span>
        </div>
        <div className="flex items-center">
          <Timer className="h-4 w-4 mr-1" />
          <span>{test.time_limit || 30}m</span>
        </div>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-[#137fec]/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
      >
        <span>Start Test</span>
        <ArrowForward className="h-4 w-4" />
      </button>
    </div>
  );
}

// Regular test card
function TestCard({ test, onStart }: { test: Test; onStart: () => void }) {
  const formatExpiry = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-[#137fec]/30 dark:hover:border-[#137fec]/30 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{test.title}</h3>
            <span className="w-2 h-2 rounded-full bg-[#137fec]"></span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{test.description || test.course_name}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
            <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <FormatListNumbered className="h-3 w-3 mr-1 text-[#137fec]" />
              {test.questions?.length || 0} Questions
            </span>
            <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Schedule className="h-3 w-3 mr-1 text-[#137fec]" />
              {test.time_limit || 30} Mins
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {test.ends_at ? `Expires ${formatExpiry(test.ends_at)}` : 'No deadline'}
        </span>
        <button
          onClick={onStart}
          className="bg-[#137fec]/10 hover:bg-[#137fec]/20 text-[#137fec] font-medium py-1.5 px-4 rounded-lg text-sm transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  );
}

// Recent result card
function RecentResultCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-transparent dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
          <span className="font-bold text-sm">A+</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Chemistry Basics</h4>
          <p className="text-xs text-gray-500">Completed yesterday</p>
        </div>
      </div>
      <div className="text-right">
        <span className="block text-sm font-bold text-gray-900 dark:text-white">92%</span>
        <button className="text-xs text-[#137fec]">Details</button>
      </div>
    </div>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { data: tests, isLoading } = useStudentTests();

  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  // Separate tests
  const availableTests = tests?.filter((t: Test & { attempt?: Attempt }) => !t.attempt || t.attempt.status === 'NOT_STARTED') || [];
  const completedTests = tests?.filter((t: Test & { attempt?: Attempt }) => t.attempt?.status === 'GRADED' || t.attempt?.status === 'SUBMITTED') || [];
  const priorityTest = availableTests[0];

  const handleStartTest = (testId: number) => {
    navigate(`/student/test/${testId}`);
  };

  const handleViewResult = (attemptId: number) => {
    navigate(`/student/result/${attemptId}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-gray-900 dark:text-white font-['Lexend',sans-serif] h-screen flex flex-col overflow-hidden antialiased">
      {/* Header */}
      <header className="flex-none px-4 pt-4 pb-2 bg-[#f6f7f8] dark:bg-[#101922] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">My Tests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ready to learn?</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#137fec]/10 flex items-center justify-center overflow-hidden border border-[#137fec]/20">
              <img
                alt="Student profile avatar"
                className="w-full h-full object-cover"
                src={user?.telegram_username ? `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=137fec&color=fff` : MOCK_STUDENT.avatar}
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:bg-[#101922] rounded-full"></div>
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg flex relative">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 text-center ${
              activeTab === 'available'
                ? 'bg-white dark:bg-[#101922] shadow-sm text-[#137fec]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 text-center ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-[#101922] shadow-sm text-[#137fec]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-2 space-y-4 pb-24 no-scrollbar">
        {activeTab === 'available' ? (
          <>
            {/* Priority Section */}
            {priorityTest && (
              <div className="mb-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Bolt className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Priority
                  </span>
                </div>
                <PriorityTestCard
                  test={priorityTest}
                  onStart={() => handleStartTest(priorityTest.id)}
                />
              </div>
            )}

            {/* Available Tests */}
            <div>
              <div className="flex items-center justify-between mb-2 mt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Up Next
                </span>
              </div>

              {isLoading ? (
                <LoadingCard count={3} />
              ) : availableTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                  <div className="w-32 h-32 bg-gradient-to-tr from-[#137fec]/20 to-blue-200 rounded-full flex items-center justify-center mb-4">
                    <Quiz className="h-12 w-12 text-[#137fec]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Caught Up!</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    You have no pending tests at the moment. Great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTests.slice(1).map((test: Test) => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onStart={() => handleStartTest(test.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Results Preview */}
            {completedTests.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Recent Results
                  </span>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className="text-xs text-[#137fec] font-medium"
                  >
                    View All
                  </button>
                </div>
                <RecentResultCard onClick={() => navigate('/student/result/100')} />
              </div>
            )}
          </>
        ) : (
          /* Completed Tests */
          <div className="space-y-4">
            {completedTests.length === 0 ? (
              <EmptyState
                icon={<EmojiEvents className="h-12 w-12" />}
                title="No completed tests yet"
                description="Your completed tests will appear here."
              />
            ) : (
              completedTests.map((test: Test & { attempt?: Attempt }) => (
                <div
                  key={test.id}
                  onClick={() => test.attempt && handleViewResult(test.attempt.id)}
                  className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-transparent dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                      <span className="font-bold text-sm">
                        {test.attempt?.percentage ? Math.round(test.attempt.percentage) : '--'}%
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{test.title}</h4>
                      <p className="text-xs text-gray-500">
                        {test.attempt?.submitted_at
                          ? `Completed ${formatDistanceToNow(new Date(test.attempt.submitted_at), { addSuffix: true })}`
                          : 'In progress'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                      {test.attempt?.score}/{test.attempt?.max_score}
                    </span>
                    <button className="text-xs text-[#137fec]">Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center text-xs font-medium text-gray-500 fixed bottom-0 left-0 right-0 z-50">
        <button className="flex flex-col items-center space-y-1 text-[#137fec]">
          <Dashboard className="h-5 w-5" />
          <span>Tests</span>
        </button>
        <button className="flex flex-col items-center space-y-1 hover:text-gray-900 dark:hover:text-white">
          <EmojiEvents className="h-5 w-5" />
          <span>Results</span>
        </button>
        <button className="flex flex-col items-center space-y-1 hover:text-gray-900 dark:hover:text-white">
          <Person className="h-5 w-5" />
          <span>Profile</span>
        </button>
      </nav>

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

export default StudentDashboard;
