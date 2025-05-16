import { format } from 'date-fns';
import { supabase } from './supabase';
import { logEvent, logDebug, logError, LogCategory } from './logger';

/**
 * Interface for habit completion data
 */
export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  status: 'completed' | null;
  user_id: string;
}

/**
 * Interface for habit data
 */
export interface Habit {
  id: string;
  name: string;
  description: string;
  goal_id: string;
  user_id: string;
  created_at: string;
  icon?: string;
}

/**
 * Interface for goal data
 */
export interface Goal {
  id: string;
  goal: string;
  user_id: string;
  created_at: string;
}

/**
 * Interface for streak data
 */
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
}

/**
 * Fetch habit completion history for a date range
 * 
 * @param userId User ID to fetch completions for
 * @param startDate Start date for the range
 * @param endDate End date for the range
 * @returns Promise resolving to habit completions
 */
export const fetchHabitHistory = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<HabitCompletion[]> => {
  try {
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    logEvent(LogCategory.HABITS, 'Fetching habit history', {
      userId,
      startDate: startDateStr,
      endDate: endDateStr
    });
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_date', startDateStr)
      .lte('completed_date', endDateStr);
    
    if (error) {
      logError(LogCategory.DB, 'Error fetching habit history', { error: error.message });
      throw new Error(`Failed to fetch habit history: ${error.message}`);
    }
    
    logDebug(LogCategory.HABITS, 'Habit history fetched', { 
      count: data?.length || 0,
      dateRange: `${startDateStr} to ${endDateStr}`
    });
    
    return data || [];
  } catch (err) {
    logError(LogCategory.SYSTEM, 'Unexpected error in fetchHabitHistory', { 
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }
};

/**
 * Calculate streak information for a habit
 * 
 * @param userId User ID to calculate streak for
 * @param habitId Habit ID to calculate streak for
 */
export const calculateStreak = async (
  userId: string,
  habitId: string
): Promise<StreakInfo> => {
  try {
    logEvent(LogCategory.HABITS, 'Calculating streak', { userId, habitId });
    
    // Get all completions for this habit
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_date')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('status', 'completed')
      .order('completed_date', { ascending: true });
    
    if (error) {
      logError(LogCategory.DB, 'Error fetching completions for streak', { error: error.message });
      return { currentStreak: 0, longestStreak: 0, lastCompletionDate: null };
    }
    
    if (!data || data.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastCompletionDate: null };
    }
    
    // Sort dates and get unique dates
    const dates = [...new Set(data.map(c => c.completed_date))].sort();
    
    let currentStreak = 1;
    let maxStreak = 1;
    let previousDate = new Date(dates[0]);
    
    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      
      // Check if dates are consecutive
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        // Break in streak
        currentStreak = 1;
      }
      
      previousDate = currentDate;
    }
    
    // Check if current streak is still active
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // If the last completion was more than 1 day ago, reset current streak
    const isActiveStreak = diffDays <= 1;
    
    return {
      currentStreak: isActiveStreak ? currentStreak : 0,
      longestStreak: maxStreak,
      lastCompletionDate: dates[dates.length - 1]
    };
  } catch (err) {
    logError(LogCategory.SYSTEM, 'Error calculating streak', { 
      error: err instanceof Error ? err.message : String(err)
    });
    return { currentStreak: 0, longestStreak: 0, lastCompletionDate: null };
  }
}; 