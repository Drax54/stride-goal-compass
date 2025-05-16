import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { logEvent, logError, LogCategory } from '../../lib/logger';
import { fetchHabitHistory, calculateStreak } from '../../lib/habit-history';
import type { HabitCompletion } from '../../lib/habit-history';

interface HabitStats {
  habitId: string;
  habitName: string;
  goalName: string;
  completionCount: number;
  possibleDays: number;
  completionRate: number;
  streakInfo?: {
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate: string | null;
  };
}

interface MonthlyData {
  month: string;
  completions: number;
}

const ProgressView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      logEvent(LogCategory.HABITS, 'Fetching progress data', { period: selectedPeriod });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        logError(LogCategory.AUTH, 'Authentication error in ProgressView', { error: userError?.message });
        setError('You must be signed in to view your progress');
        setLoading(false);
        return;
      }

      // Get date range based on selected period
      const today = new Date();
      let startDate: Date, endDate: Date;
      
      if (selectedPeriod === 'month') {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      } else {
        startDate = startOfYear(today);
        endDate = endOfYear(today);
      }
      
      // Fetch habit completions from our utility
      let completions: HabitCompletion[];
      try {
        completions = await fetchHabitHistory(user.id, startDate, endDate);
      } catch (historyError) {
        logError(LogCategory.HABITS, 'Failed to fetch habit history', {
          error: historyError instanceof Error ? historyError.message : String(historyError)
        });
        setError('Could not load your completion data');
        setLoading(false);
        return;
      }
      
      // Fetch habits and goals
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, description, goal_id')
        .eq('user_id', user.id);
        
      if (habitsError) {
        logError(LogCategory.DB, 'Error fetching habits', { error: habitsError.message });
        setError('Could not load your habits');
        setLoading(false);
        return;
      }
      
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('id, goal')
        .eq('user_id', user.id);
        
      if (goalsError) {
        logError(LogCategory.DB, 'Error fetching goals', { error: goalsError.message });
        setError('Could not load your goals');
        setLoading(false);
        return;
      }
      
      // Calculate stats for each habit with streak information
      const stats: HabitStats[] = [];
      for (const habit of habits || []) {
        const habitCompletions = completions?.filter(c => c.habit_id === habit.id) || [];
        const goal = goals?.find(g => g.id === habit.goal_id);
        
        // Calculate possible days (assumes daily habits for simplicity)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Get streak info
        const streakInfo = await calculateStreak(user.id, habit.id);
        
        stats.push({
          habitId: habit.id,
          habitName: habit.name,
          goalName: goal?.goal || 'Unknown Goal',
          completionCount: habitCompletions.length,
          possibleDays: daysDiff,
          completionRate: daysDiff > 0 ? (habitCompletions.length / daysDiff) * 100 : 0,
          streakInfo
        });
      }
      
      setHabitStats(stats.sort((a, b) => b.completionRate - a.completionRate));
      
      // Calculate monthly data for the chart
      if (selectedPeriod === 'year') {
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        const monthlyStats: MonthlyData[] = [];
        
        for (const month of months) {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const monthCompletions = completions?.filter(c => {
            const date = new Date(c.completed_date);
            return date >= monthStart && date <= monthEnd;
          }) || [];
          
          monthlyStats.push({
            month: format(month, 'MMM'),
            completions: monthCompletions.length
          });
        }
        
        setMonthlyData(monthlyStats);
      }
      
      // Calculate overall streaks across all habits
      let maxStreak = 0;
      let currentActiveStreak = 0;
      
      for (const stat of stats) {
        if (stat.streakInfo) {
          maxStreak = Math.max(maxStreak, stat.streakInfo.longestStreak);
          currentActiveStreak = Math.max(currentActiveStreak, stat.streakInfo.currentStreak);
        }
      }
      
      setLongestStreak(maxStreak);
      setCurrentStreak(currentActiveStreak);
      
      logEvent(LogCategory.HABITS, 'Progress data loaded', { 
        habitCount: habits?.length || 0,
        completionCount: completions?.length || 0
      });
    } catch (error) {
      logError(LogCategory.UI, 'Error in ProgressView', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderHabitStats = () => {
    return habitStats.map(stat => (
      <div key={stat.habitId} className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900">{stat.habitName}</h3>
            <p className="text-sm text-gray-600">Goal: {stat.goalName}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{stat.completionCount}</div>
            <div className="text-sm text-gray-500">completions</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Completion rate</span>
            <span>{stat.completionRate.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${stat.completionRate}%` }}
            ></div>
          </div>
        </div>
        
        {stat.streakInfo && (
          <div className="mt-3 flex justify-between text-sm">
            <div>
              <span className="text-gray-600">Current streak: </span>
              <span className="font-medium">{stat.streakInfo.currentStreak} days</span>
            </div>
            <div>
              <span className="text-gray-600">Best streak: </span>
              <span className="font-medium">{stat.streakInfo.longestStreak} days</span>
            </div>
          </div>
        )}
      </div>
    ));
  };

  const renderMonthlyChart = () => {
    if (monthlyData.length === 0) return null;
    
    const maxValue = Math.max(...monthlyData.map(d => d.completions));
    
    return (
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-4">Monthly Completions</h3>
        <div className="flex items-end h-40 space-x-2">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-indigo-600 rounded-t"
                style={{ 
                  height: `${(data.completions / maxValue) * 100}%`,
                  minHeight: data.completions > 0 ? '4px' : '0'
                }}
              ></div>
              <div className="text-xs mt-1 text-gray-600">{data.month}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Progress Tracking</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-md ${
              selectedPeriod === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-md ${
              selectedPeriod === 'year'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
              <div className="text-sm uppercase font-medium opacity-75 mb-1">Longest Streak</div>
              <div className="text-4xl font-bold mb-1">{longestStreak} days</div>
              <div className="text-sm opacity-75">Keep going to beat your record!</div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-lg shadow-md">
              <div className="text-sm uppercase font-medium opacity-75 mb-1">Current Streak</div>
              <div className="text-4xl font-bold mb-1">{currentStreak} days</div>
              <div className="text-sm opacity-75">
                {currentStreak > 0 
                  ? "You're on a roll! Keep it up!" 
                  : "Complete a habit today to start a new streak!"}
              </div>
            </div>
          </div>

          <h3 className="font-medium text-gray-900 mb-4">Habit Performance</h3>
          {habitStats.length > 0 ? (
            <div>{renderHabitStats()}</div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-600">No habit data available for this period.</p>
            </div>
          )}

          {selectedPeriod === 'year' && renderMonthlyChart()}
        </div>
      )}
    </div>
  );
};

export default ProgressView; 