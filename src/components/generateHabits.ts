import { GoalHabits, Habit } from '../types/habits';
import { generateHabitsForGoal } from '../lib/openai';

// Map of common goal themes and suggested habits for them
const habitSuggestions: Record<string, Habit[]> = {
  health: [
    {
      name: 'Morning stretching routine',
      description: 'Spend 5-10 minutes each morning stretching to improve flexibility and wake up your body',
      frequency: 'daily'
    },
    {
      name: 'Track water intake',
      description: 'Track and ensure you drink at least 8 glasses of water daily',
      frequency: 'daily'
    }
  ],
  fitness: [
    {
      name: 'Regular exercise',
      description: 'Exercise for at least 30 minutes, 3-5 times per week',
      frequency: 'weekly'
    },
    {
      name: 'Daily steps goal',
      description: 'Walk at least 8,000 steps every day to maintain mobility and health',
      frequency: 'daily'
    }
  ],
  nutrition: [
    {
      name: 'Meal planning session',
      description: 'Plan your meals for the week ahead to ensure balanced nutrition',
      frequency: 'weekly'
    },
    {
      name: 'Eat vegetables with every meal',
      description: 'Include a serving of vegetables with each main meal',
      frequency: 'daily'
    }
  ],
  learning: [
    {
      name: 'Dedicated study time',
      description: 'Set aside 30 minutes for focused learning on your chosen topic',
      frequency: 'daily'
    },
    {
      name: 'Weekly review session',
      description: 'Review and consolidate what you learned during the week',
      frequency: 'weekly'
    }
  ],
  productivity: [
    {
      name: 'Morning planning session',
      description: 'Plan your day every morning to prioritize tasks and stay focused',
      frequency: 'daily'
    },
    {
      name: 'Weekly review and planning',
      description: 'Review the past week and plan for the next one',
      frequency: 'weekly'
    }
  ],
  mindfulness: [
    {
      name: 'Daily meditation',
      description: 'Practice meditation for at least 10 minutes daily',
      frequency: 'daily'
    },
    {
      name: 'Gratitude journal',
      description: 'Write down three things you are grateful for each day',
      frequency: 'daily'
    }
  ]
};

// Default habits to use when no specific suggestions match
const defaultHabits: Habit[] = [
  {
    name: 'Daily progress check',
    description: 'Take a few minutes daily to track your progress toward your goal',
    frequency: 'daily'
  },
  {
    name: 'Weekly review and planning',
    description: 'Review your progress and plan next steps for the coming week',
    frequency: 'weekly'
  }
];

// Find relevant habit suggestions based on keywords in the goal
function findRelevantHabits(goal: string): Habit[] {
  // Convert goal to lowercase for case-insensitive matching
  const goalLower = goal.toLowerCase();
  
  // Find the most relevant suggestion category based on keywords
  for (const [category, habits] of Object.entries(habitSuggestions)) {
    if (goalLower.includes(category)) {
      console.log(`⚡ Found relevant category "${category}" for goal "${goal}"`);
      return habits;
    }
  }
  
  // If no direct category match, look for partial matches
  for (const [category, habits] of Object.entries(habitSuggestions)) {
    const words = category.split(/[_\s-]/);
    for (const word of words) {
      if (word.length > 3 && goalLower.includes(word)) {
        console.log(`⚡ Found partial match "${word}" for goal "${goal}"`);
        return habits;
      }
    }
  }
  
  // Return default habits if no match found
  console.log(`⚡ No specific matches for goal "${goal}", using default habits`);
  return defaultHabits;
}

// Generate customized habits for each goal
export async function generateHabits(goals: string[]): Promise<GoalHabits[]> {
  console.log("⚡ Generating habits for goals:", goals);
  
  try {
    const results: GoalHabits[] = [];
    
    // Process each goal one by one
    for (const goal of goals) {
      console.log(`⚡ Creating habits for goal: "${goal}"`);
      
      try {
        // Try to use OpenAI to generate habits
        console.log(`⚡ Calling OpenAI for goal: "${goal}"`);
        const openAiHabits = await generateHabitsForGoal(goal);
        
        // Map the OpenAI habit format to our app's format
        const mappedHabits: Habit[] = openAiHabits.map(habit => {
          // Ensure frequency is either 'daily' or 'weekly'
          let frequency: 'daily' | 'weekly' = 'daily';
          if (habit.frequency === 'weekly') {
            frequency = 'weekly';
          }
          
          return {
            name: habit.name,
            description: habit.description,
            frequency: frequency
          };
        });
        
        console.log(`⚡ OpenAI generated ${mappedHabits.length} habits for "${goal}":`, mappedHabits);
        
        if (mappedHabits.length > 0) {
          results.push({
            goal,
            habits: mappedHabits
          });
          continue; // Move to the next goal
        } else {
          console.log(`⚡ No OpenAI habits generated for "${goal}", falling back to suggestions`);
        }
      } catch (error) {
        console.error(`⚡ Error with OpenAI for goal "${goal}":`, error);
        console.log(`⚡ Falling back to built-in suggestions for "${goal}"`);
      }
      
      // Fallback: Find relevant habit suggestions
      const suggestedHabits = findRelevantHabits(goal);
      
      // Customize habit names and descriptions for this specific goal
      const customizedHabits = suggestedHabits.map(habit => {
        const customHabit: Habit = {
          ...habit,
          name: habit.name.includes(goal) ? habit.name : `${habit.name} for ${goal}`,
          description: habit.description.includes(goal) 
            ? habit.description 
            : `${habit.description} to help achieve your goal: ${goal}`
        };
        return customHabit;
      });
      
      console.log(`⚡ Created ${customizedHabits.length} fallback habits for "${goal}"`);
      
      results.push({
        goal,
        habits: customizedHabits
      });
    }
    
    return results;
  } catch (error) {
    console.error("⚡ Error in overall habit generation:", error);
    
    // Return simple fallback habits even if there's an error
    return goals.map(goal => ({
      goal,
      habits: [
        {
          name: `Practice ${goal}`,
          description: `A simple habit for ${goal.toLowerCase()}`,
          frequency: 'daily'
        },
        {
          name: `Review progress on ${goal}`,
          description: `Weekly review of your progress towards ${goal.toLowerCase()}`,
          frequency: 'weekly'
        }
      ]
    }));
  }
} 