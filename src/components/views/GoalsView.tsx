import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Edit2, Save, Trash2, Loader2 } from 'lucide-react';
import { generateHabitsForGoal } from '../../lib/openai';

interface Goal {
  id: string;
  goal: string;
  user_id: string;
  created_at?: string;
}

interface GoalsViewProps {
  onGoalsUpdate?: () => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ onGoalsUpdate }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editedGoalText, setEditedGoalText] = useState('');
  const [creatingHabits, setCreatingHabits] = useState(false);
  const [currentGoalProgress, setCurrentGoalProgress] = useState<string>('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to view your goals");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching goals:", error);
        setError("Failed to load your goals");
        setLoading(false);
        return;
      }
      
      setGoals(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const createHabitsForGoal = async (goalId: string, goalName: string) => {
    try {
      setCreatingHabits(true);
      setCurrentGoalProgress('Generating habits with AI...');

      const habits = await generateHabitsForGoal(goalName);
      
      setCurrentGoalProgress('Creating habits in database...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create habits in database
      for (const habit of habits) {
        await supabase.from('habits').insert({
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          goal_id: goalId,
          user_id: user.id,
          created_at: new Date().toISOString()
        });
      }

      // Notify parent component to refresh habits
      if (onGoalsUpdate) {
        onGoalsUpdate();
      }

      setCurrentGoalProgress('');
    } catch (error) {
      console.error('Error creating habits:', error);
      setError('Failed to create habits');
    } finally {
      setCreatingHabits(false);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please sign in to add goals');
        return;
      }

      const { data: goalData, error: goalError } = await supabase
        .from('user_goals')
        .insert({
          goal: newGoal.trim(),
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Add the new goal to the start of the list
      setGoals(prev => [goalData, ...prev]);
      setNewGoal('');

      // Generate habits for the new goal
      if (goalData) {
        await createHabitsForGoal(goalData.id, goalData.goal);
      }

    } catch (error) {
      setError('Error adding goal');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (goalId: string) => {
    if (!editedGoalText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ goal: editedGoalText.trim() })
        .eq('id', goalId);

      if (error) {
        console.error("Error updating goal:", error);
        setError("Failed to update goal");
        return;
      }

      // Update the goal in the list
      setGoals(goals.map(g => g.id === goalId ? { ...g, goal: editedGoalText.trim() } : g));
      setEditingGoalId(null);
      setEditedGoalText('');
      setError(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      setError("An unexpected error occurred");
    }
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal and its associated habits?')) {
      return;
    }

    try {
      setLoading(true);
      
      // First delete associated habits
      const { error: habitsError } = await supabase
        .from('habits')
        .delete()
        .eq('goal_id', id);

      if (habitsError) throw habitsError;

      // Then delete the goal
      const { error: goalError } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', id);

      if (goalError) throw goalError;

      setGoals(goals.filter(goal => goal.id !== id));
      
      // Notify parent component to refresh habits
      if (onGoalsUpdate) {
        onGoalsUpdate();
      }
    } catch (error) {
      setError('Error deleting goal');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditedGoalText(goal.goal);
  };

  if (loading && !creatingHabits) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Your Goals</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            <Plus size={16} className="mr-1" /> Add Goal
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Enter a new goal..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="ml-2 flex space-x-2">
              <button
                onClick={addGoal}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewGoal('');
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingHabits && (
        <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{currentGoalProgress}</span>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">You haven't set any goals yet.</p>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Add Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {editingGoalId === goal.id ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editedGoalText}
                    onChange={(e) => setEditedGoalText(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                  <div className="ml-2 flex space-x-2">
                    <button
                      onClick={() => updateGoal(goal.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoalId(null);
                        setEditedGoalText('');
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-800">{goal.goal}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(goal)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsView;
