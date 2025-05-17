import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, getYear, eachMonthOfInterval, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { logEvent, logDebug, logError, createTimer, LogCategory } from '../../lib/logger';

interface Goal {
  id: string;
  created_at: string;
  user_id: string;
  goal: string;
  why: string;
  how: string;
  date: string;
  time: string;
  area: string;
}

interface HabitCompletion {
  id: string;
  created_at: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
}

interface User {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: any;
  identities: any[];
  created_at: string;
  updated_at: string;
}

const YearView: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(() => getYear(new Date()));
  const [months, setMonths] = useState<Date[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, 'completed' | null>>({});
  const [user, setUser] = useState<User | null>(null);
  
  // Add this state for processing habits to fix the errors
  const [processingHabits, setProcessingHabits] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true);
      setError(null);
      try {
        const timer = createTimer();
        logDebug(LogCategory.HabitCompletion, 'Fetching user and goals for year view');

        // Fetch User
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(userData?.user || null);

        if (!userData?.user) {
          console.warn('No user found, skipping data fetch.');
          return;
        }

        // Fetch Goals for the year
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userData.user.id)
          .gte('date', format(startOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'))
          .lte('date', format(endOfYear(new Date(currentYear, 11, 31)), 'yyyy-MM-dd'));

        if (goalsError) throw goalsError;
        setGoals(goalsData || []);

        // Fetch Habit Completions for the year
        const { data: completionsData, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', userData.user.id)
          .gte('date', format(startOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'))
          .lte('date', format(endOfYear(new Date(currentYear, 11, 31)), 'yyyy-MM-dd'));

        if (completionsError) throw completionsError;
        setCompletions(completionsData || []);

        // Transform completions into a more usable format
        const transformedCompletions: Record<string, 'completed' | null> = {};
        completionsData?.forEach(completion => {
          transformedCompletions[completion.habit_id + '-' + completion.date] = 'completed';
        });
        setHabitCompletions(transformedCompletions);

        logEvent(LogCategory.HabitCompletion, 'Fetched year view data', { duration: timer() });
      } catch (err: any) {
        logError(LogCategory.HabitCompletion, 'Error fetching year view data', err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    // Generate months for the year
    const generateMonths = () => {
      const yearStart = startOfYear(new Date(currentYear, 0, 1));
      const yearEnd = endOfYear(new Date(currentYear, 11, 31));
      const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      setMonths(monthsInYear);
    };

    fetchYearData();
    generateMonths();
  }, [currentYear]);

  const goToPreviousYear = () => {
    setCurrentYear(prevYear => subYears(new Date(prevYear, 0, 1), 1).getFullYear());
  };

  const goToNextYear = () => {
    setCurrentYear(prevYear => addYears(new Date(prevYear, 0, 1), 1).getFullYear());
  };
  
  // Fix the handleHabitCompletion function to properly use setProcessingHabits
  const handleHabitCompletion = async (habitId: string, date: Date) => {
    // Format the date for storage and display
    const dateStr = format(date, 'yyyy-MM-dd');
    const processingKey = `${habitId}-${dateStr}`;
    
    if (processingHabits[processingKey]) {
      console.log(`🛑 Already processing ${processingKey}, ignoring.`);
      return;
    }
    
    // Start processing - show visual feedback
    console.log(`⏳ Setting processing state for ${processingKey} to true`);
    setProcessingHabits((prev: Record<string, boolean>) => {
      const newState = { ...prev, [processingKey]: true };
      console.log(`⚙️ New processing state:`, newState);
      return newState;
    });
    
    try {
      const timer = createTimer();
      logDebug(LogCategory.HabitCompletion, `Toggling habit completion for habit ${habitId} on ${dateStr}`);
      
      // Check if the habit is already completed on this date
      const isCompleted = !!completions.find(completion => completion.habit_id === habitId && completion.date === dateStr);
      
      if (isCompleted) {
        // If it's completed, remove the completion
        const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', dateStr)
        .eq('user_id', user?.id);
        
        if (deleteError) {
          logError(LogCategory.HabitCompletion, `Error deleting habit completion for habit ${habitId} on ${dateStr}`, deleteError);
          setError("Failed to remove completion. Please try again.");
          return;
        }
        
        // Update state to reflect the deletion
        setCompletions(prevCompletions => prevCompletions.filter(completion => !(completion.habit_id === habitId && completion.date === dateStr)));
        setHabitCompletions(prev => {
          const { [`${habitId}-${dateStr}`]: _, ...rest } = prev;
          return rest;
        });
        
        logEvent(LogCategory.HabitCompletion, `Removed habit completion for habit ${habitId} on ${dateStr}`, { duration: timer() });
      } else {
        // If it's not completed, add a completion
        const { data: insertData, error: insertError } = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habitId, user_id: user?.id, date: dateStr }])
        .select();
        
        if (insertError) {
          logError(LogCategory.HabitCompletion, `Error inserting habit completion for habit ${habitId} on ${dateStr}`, insertError);
          setError("Failed to add completion. Please try again.");
          return;
        }
        
        // Ensure insertData is not null and has at least one element
        if (insertData && insertData.length > 0) {
          const newCompletion = insertData[0];
          
          // Update state to reflect the insertion
          setCompletions(prevCompletions => [...prevCompletions, newCompletion]);
          setHabitCompletions(prev => ({ ...prev, [`${habitId}-${dateStr}`]: 'completed' }));
          
          logEvent(LogCategory.HabitCompletion, `Added habit completion for habit ${habitId} on ${dateStr}`, { duration: timer() });
        } else {
          const errorMessage = "Failed to insert completion: No data returned.";
          logError(LogCategory.HabitCompletion, errorMessage, new Error(errorMessage));
          setError("Failed to add completion. Please try again.");
          return;
        }
      }
    } catch (error) {
      console.log(`❌ Unexpected exception: ${error}`);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      // Remove processing state
      setProcessingHabits((prev: Record<string, boolean>) => ({
        ...prev,
        [processingKey]: false
      }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={goToPreviousYear} className="bg-gray-200 hover:bg-gray-300 rounded-full p-2">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-semibold">{currentYear}</h2>
        <button onClick={goToNextYear} className="bg-gray-200 hover:bg-gray-300 rounded-full p-2">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {months.map((month) => (
            <div key={month.toISOString()} className="p-3 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-center mb-2">{format(month, 'MMMM')}</h3>
              <div className="flex flex-col">
                {goals.filter(goal => getYear(new Date(goal.date)) === currentYear && format(new Date(goal.date), 'MMMM') === format(month, 'MMMM')).map(goal => (
                  <div key={goal.id} className="mb-2">
                    <p className="text-sm font-medium">{goal.goal}</p>
                    {/* Display habit completions for each goal */}
                    {/* You would need to fetch habits related to this goal to accurately display completions */}
                    {/* This is a placeholder for the actual habit completion status */}
                    {/* <p className="text-xs text-gray-500">Habit Completion: [Completion Status]</p> */}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearView;
