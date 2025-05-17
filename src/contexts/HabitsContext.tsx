
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { logEvent, logError, LogCategory, createTimer } from '../lib/logger';
import { format } from 'date-fns';

// Define types
export interface Goal {
  id: string;
  user_id: string;
  goal: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  goal_id: string;
  created_at: string;
  updated_at: string;
  icon?: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string;
  status: 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface HabitsContextType {
  goals: Goal[];
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  fetchHabits: () => Promise<void>;
  fetchCompletions: (startDate: Date, endDate: Date) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date: Date) => Promise<void>;
  createGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Goal | null>;
  createHabit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Habit | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  deleteHabit: (habitId: string) => Promise<boolean>;
}

const HabitsContext = createContext<HabitsContextType>({
  goals: [],
  habits: [],
  completions: [],
  isLoading: false,
  error: null,
  fetchGoals: async () => {},
  fetchHabits: async () => {},
  fetchCompletions: async () => {},
  toggleHabitCompletion: async () => {},
  createGoal: async () => null,
  createHabit: async () => null,
  deleteGoal: async () => false,
  deleteHabit: async () => false
});

export const useHabits = () => useContext(HabitsContext);

interface HabitsProviderProps {
  children: ReactNode;
}

export const HabitsProvider = ({ children }: HabitsProviderProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Fetch goals
  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const timer = createTimer(LogCategory.PERFORMANCE, 'Fetch goals');
      
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setGoals(data || []);
      timer.stop();
    } catch (error) {
      logError(LogCategory.DB, 'Failed to fetch goals', { error });
      setError('Failed to load goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch habits
  const fetchHabits = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const timer = createTimer(LogCategory.PERFORMANCE, 'Fetch habits');
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setHabits(data || []);
      timer.stop();
    } catch (error) {
      logError(LogCategory.DB, 'Failed to fetch habits', { error });
      setError('Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch completions
  const fetchCompletions = async (startDate: Date, endDate: Date) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const timer = createTimer(LogCategory.PERFORMANCE, 'Fetch completions');
      
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', startDateStr)
        .lte('completed_date', endDateStr);
        
      if (error) throw error;
      
      setCompletions(data || []);
      timer.stop();
    } catch (error) {
      logError(LogCategory.DB, 'Failed to fetch completions', { error });
      setError('Failed to load habit completions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle habit completion
  const toggleHabitCompletion = async (habitId: string, date: Date) => {
    if (!user) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if completion already exists
      const existingCompletion = completions.find(
        c => c.habit_id === habitId && c.completed_date === dateStr
      );
      
      if (existingCompletion) {
        // Delete completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);
          
        if (error) throw error;
        
        // Update state
        setCompletions(completions.filter(c => c.id !== existingCompletion.id));
        logEvent(LogCategory.HABITS, 'Habit completion removed', { habitId, date: dateStr });
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            completed_date: dateStr,
            status: 'completed'
          })
          .select();
          
        if (error) throw error;
        
        if (data) {
          setCompletions([...completions, data[0]]);
          logEvent(LogCategory.HABITS, 'Habit completion added', { habitId, date: dateStr });
        }
      }
    } catch (error) {
      logError(LogCategory.DB, 'Failed to update habit completion', { error });
      setError('Failed to update habit completion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create goal
  const createGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          ...goal
        })
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setGoals([...goals, data[0]]);
        logEvent(LogCategory.HABITS, 'Goal created', { goalId: data[0].id });
        return data[0];
      }
      
      return null;
    } catch (error) {
      logError(LogCategory.DB, 'Failed to create goal', { error });
      setError('Failed to create goal. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create habit
  const createHabit = async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          ...habit
        })
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setHabits([...habits, data[0]]);
        logEvent(LogCategory.HABITS, 'Habit created', { habitId: data[0].id });
        return data[0];
      }
      
      return null;
    } catch (error) {
      logError(LogCategory.DB, 'Failed to create habit', { error });
      setError('Failed to create habit. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete goal
  const deleteGoal = async (goalId: string) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setGoals(goals.filter(g => g.id !== goalId));
      logEvent(LogCategory.HABITS, 'Goal deleted', { goalId });
      return true;
    } catch (error) {
      logError(LogCategory.DB, 'Failed to delete goal', { error });
      setError('Failed to delete goal. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete habit
  const deleteHabit = async (habitId: string) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setHabits(habits.filter(h => h.id !== habitId));
      logEvent(LogCategory.HABITS, 'Habit deleted', { habitId });
      return true;
    } catch (error) {
      logError(LogCategory.DB, 'Failed to delete habit', { error });
      setError('Failed to delete habit. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HabitsContext.Provider
      value={{
        goals,
        habits,
        completions,
        isLoading,
        error,
        fetchGoals,
        fetchHabits,
        fetchCompletions,
        toggleHabitCompletion,
        createGoal,
        createHabit,
        deleteGoal,
        deleteHabit
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};
