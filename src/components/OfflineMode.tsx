import React, { useState, useEffect } from 'react';
import { saveCompletionLocally } from '../lib/supabase-tables';

interface Habit {
  id: string;
  name: string;
  description?: string;
}

const OfflineMode: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [newHabitName, setNewHabitName] = useState('');
  const [currentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Load any locally saved data
  useEffect(() => {
    const loadLocalData = () => {
      // Load habits from localStorage
      const savedHabits = localStorage.getItem('offline_habits');
      if (savedHabits) {
        try {
          setHabits(JSON.parse(savedHabits));
        } catch (e) {
          console.error('Error parsing saved habits:', e);
        }
      }

      // Load completions from localStorage
      const savedCompletions = localStorage.getItem('habit_completions');
      if (savedCompletions) {
        try {
          setCompletions(JSON.parse(savedCompletions));
        } catch (e) {
          console.error('Error parsing saved completions:', e);
        }
      }
    };

    loadLocalData();
  }, []);

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('offline_habits', JSON.stringify(habits));
    }
  }, [habits]);

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: `offline-${Date.now()}`,
        name: newHabitName.trim(),
        description: 'Created in offline mode'
      };
      
      setHabits([...habits, newHabit]);
      setNewHabitName('');
    }
  };

  const handleToggleCompletion = (habitId: string) => {
    // Check current completion status
    const isCurrentlyCompleted = completions[habitId]?.[currentDate] || false;
    
    // Toggle completion status
    const updatedStatus = !isCurrentlyCompleted;
    
    // Save to local storage
    saveCompletionLocally(habitId, currentDate, updatedStatus);
    
    // Update state
    setCompletions(prev => {
      const updated = { ...prev };
      if (!updated[habitId]) updated[habitId] = {};
      
      if (updatedStatus) {
        updated[habitId][currentDate] = true;
      } else {
        delete updated[habitId][currentDate];
      }
      
      return updated;
    });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Offline Mode</h2>
        <p className="text-sm text-gray-600 mb-2">
          You're currently working offline. Any habits and completions you track will be 
          saved locally and synced when you're back online.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          Check Connection
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Add New Habit</h3>
        <div className="flex">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Enter habit name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddHabit}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Today's Habits</h3>
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No habits added yet</p>
        ) : (
          <ul className="space-y-2">
            {habits.map(habit => (
              <li 
                key={habit.id} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <span>{habit.name}</span>
                <button
                  onClick={() => handleToggleCompletion(habit.id)}
                  className={`w-6 h-6 rounded-full ${
                    completions[habit.id]?.[currentDate] 
                      ? 'bg-green-500' 
                      : 'border-2 border-gray-300'
                  }`}
                >
                  {completions[habit.id]?.[currentDate] && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OfflineMode; 