
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, getYear, eachMonthOfInterval, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { logEvent, logDebug, logError, createTimer } from '../../lib/logger';
import { LogCategory } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';

interface Goal {
  id: string;
  user_id: string;
  goal: string;
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  status: 'completed' | 'failed';
}

const YearView: React.FC = () => {
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = useState(() => getYear(new Date()));
  const [months, setMonths] = useState<Date[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [_completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYearData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const timer = createTimer(LogCategory.PERFORMANCE, "YEAR_DATA_FETCH");
        logDebug(LogCategory.HABITS, 'Fetching goals for year view');

        // Fetch Goals for the year
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', format(startOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'))
          .lte('created_at', format(endOfYear(new Date(currentYear, 11, 31)), 'yyyy-MM-dd'));

        if (goalsError) throw goalsError;
        setGoals(goalsData || []);

        // Fetch Habit Completions for the year
        const { data: completionsData, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_date', format(startOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'))
          .lte('completed_date', format(endOfYear(new Date(currentYear, 11, 31)), 'yyyy-MM-dd'));

        if (completionsError) throw completionsError;
        setCompletions(completionsData || []);

        logEvent(LogCategory.HABITS, 'Fetched year view data', { 
          year: currentYear,
          goalsCount: goalsData?.length || 0,
          completionsCount: completionsData?.length || 0,
          duration: timer.stop() 
        });
      } catch (err: any) {
        logError(LogCategory.ERROR, 'Error fetching year view data', { error: err.message });
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

    generateMonths();
    
    if (user) {
      fetchYearData();
    }
  }, [currentYear, user]);

  const goToPreviousYear = () => {
    setCurrentYear(prevYear => subYears(new Date(prevYear, 0, 1), 1).getFullYear());
  };

  const goToNextYear = () => {
    setCurrentYear(prevYear => addYears(new Date(prevYear, 0, 1), 1).getFullYear());
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
                {goals.filter(goal => {
                  const goalDate = new Date(goal.created_at);
                  return getYear(goalDate) === currentYear && format(goalDate, 'MMMM') === format(month, 'MMMM');
                }).map(goal => (
                  <div key={goal.id} className="mb-2">
                    <p className="text-sm font-medium">{goal.goal}</p>
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
