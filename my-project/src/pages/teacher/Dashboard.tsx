/**
 * Teacher Dashboard Page
 * Updated to match the provided UI design
 */

'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Bell,
  Calendar,
  People,
  Edit,
  Analytics,
  MoreVert,
  Dashboard,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeacherTests, useCourses } from '@/hooks';
import { useUserStore, useAuthStore } from '@/store';
import { LoadingCard, EmptyState } from '@/components/common';
import { Test } from '@/types';
import { format } from 'date-fns';

// Mock teacher data
const MOCK_TEACHER = {
  name: 'Mr. Anderson',
  department: 'Science Department',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PUBLISHED: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-400',
      dot: 'bg-green-500',
      label: 'Published',
    },
    DRAFT: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-400',
      dot: 'bg-yellow-500',
      label: 'Draft',
    },
    ARCHIVED: {
      bg: 'bg-slate-100 dark:bg-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-500',
      label: 'Completed',
    },
  };

  const { bg, text, dot, label } = config[status] || config.DRAFT;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 ${dot} rounded-full mr-1.5`}></span>
      {label}
    </span>
  );
}

// Test card component
function TestCard({ test, onClick }: { test: Test; onClick?: () => void }) {
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d');
    } catch {
      return '--';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow active:scale-[0.98] duration-200 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <StatusBadge status={test.status} />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{test.title}</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <MoreVert className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-3 gap-4">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1 opacity-70" />
          <span>{test.created_at ? formatDate(test.created_at) : '--'}</span>
        </div>
        <div className="flex items-center">
          <People className="h-4 w-4 mr-1 opacity-70" />
          <span>{test.questions?.length || 0} Qs</span>
        </div>
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { data: tests, isLoading } = useTeacherTests();
  const { data: courses } = useCourses();

  // Filter tests by status
  const publishedTests = tests?.filter((t: Test) => t.status === 'PUBLISHED') || [];
  const draftTests = tests?.filter((t: Test) => t.status === 'DRAFT') || [];
  const archivedTests = tests?.filter((t: Test) => t.status === 'ARCHIVED') || [];

  // Calculate stats
  const totalStudents = 148; // Mock data
  const activeTests = publishedTests.length;

  const handleCreateTest = () => {
    navigate('/teacher/tests/create');
  };

  const handleTestClick = (testId: number) => {
    navigate(`/teacher/tests/${testId}`);
  };

  const handleLogout = () => {
    useAuthStore.getState().clearToken();
    useUserStore.getState().clearUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-slate-800 dark:text-slate-100 font-['Lexend',sans-serif] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#137fec]/10 dark:border-slate-800 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                alt="Teacher profile picture"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#137fec] shadow-sm"
                src={user?.telegram_username ? `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=137fec&color=fff` : MOCK_TEACHER.avatar}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                {user?.first_name || MOCK_TEACHER.name}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {MOCK_TEACHER.department}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pt-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-[#137fec]/5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-[#137fec]/10 w-20 h-20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-[#137fec]">{activeTests}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Active Tests</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-[#137fec]/5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-purple-500/10 w-20 h-20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalStudents}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Students</div>
            </div>
          </div>
        </div>

        {/* My Tests Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Tests</h2>
            <button
              onClick={() => navigate('/teacher/tests')}
              className="text-sm text-[#137fec] font-medium hover:text-blue-600 transition-colors"
            >
              View All
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
            <button className="px-4 py-1.5 bg-[#137fec] text-white rounded-full text-sm font-medium whitespace-nowrap shadow-sm shadow-[#137fec]/30">
              All
            </button>
            <button className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700">
              Published
            </button>
            <button className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700">
              Drafts
            </button>
            <button className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700">
              Archived
            </button>
          </div>

          {/* Test List */}
          {isLoading ? (
            <LoadingCard count={3} />
          ) : !tests || tests.length === 0 ? (
            <EmptyState
              icon={<Edit className="h-12 w-12" />}
              title="No tests created yet"
              description="Tap the + button to create your first assessment for students."
            />
          ) : (
            <div className="space-y-4">
              {tests.slice(0, 5).map((test: Test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onClick={() => handleTestClick(test.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={handleCreateTest}
          className="bg-[#137fec] hover:bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50">
        <div className="flex justify-around items-center h-16">
          <button className="flex flex-col items-center justify-center w-full h-full text-[#137fec]">
            <Dashboard className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/teacher/results/1')}
            className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <People className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Students</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Settings className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Settings</span>
          </button>
        </div>
        {/* Safe area spacer */}
        <div className="h-[env(safe-area-inset-bottom)] w-full bg-white dark:bg-slate-900"></div>
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

export default TeacherDashboard;
