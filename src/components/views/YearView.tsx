import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, getYear, eachMonthOfInterval, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { logEvent, logDebug, logError, createTimer, LogCategory } from '../../lib/logger';

// ... keep existing code (interfaces)

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

  // ... keep existing code (effects and functions)
  
  // Fix the handleHabitCompletion function to properly use setProcessingHabits
  const handleHabitCompletion = async (habitId: string, date: Date) => {
    // Format the date for storage and display
    const dateStr = format(date, 'yyyy-MM-dd');
    const processingKey = `${habitId}-${dateStr}`;
    
    // ... keep existing code (beginning of function)
    
    // Start processing - show visual feedback
    console.log(`⏳ Setting processing state for ${processingKey} to true`);
    setProcessingHabits((prev: Record<string, boolean>) => {
      const newState = { ...prev, [processingKey]: true };
      console.log(`⚙️ New processing state:`, newState);
      return newState;
    });
    
    try {
      // ... keep existing code (middle of function)
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

  // ... keep existing code (rest of component)

  return (
    // ... keep existing code (JSX)
  );
};

export default YearView;
