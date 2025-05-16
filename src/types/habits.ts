export interface Habit {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
}

export interface GoalHabits {
  goal: string;
  habits: Habit[];
}

export interface HabitForInsertion {
  user_id: string;
  goal_id?: string;
  name: string;
  description?: string;
  frequency?: 'daily' | 'weekly';
} 