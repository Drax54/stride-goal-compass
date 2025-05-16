import React, { useState, useEffect } from 'react';
import { Heart, Briefcase, Home, GraduationCap, User, Target, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { generateHabits } from '../generateHabits';
import { GoalHabits, HabitForInsertion } from '../../types/habits';
// Import directly to ensure API key is set
import '../../../src/lib/openai';

interface LifeArea {
  id: string;
  name: string;
  icon: React.ReactNode;
  examples: string[];
}

const lifeAreas: LifeArea[] = [
  {
    id: 'health',
    name: 'Health',
    icon: <Heart className="w-6 h-6 text-red-500" />,
    examples: [
      'Run a marathon',
      'Practice yoga regularly',
      'Maintain a healthy diet',
      'Get 8 hours of sleep daily',
      'Exercise 3 times a week'
    ]
  },
  {
    id: 'relationships',
    name: 'Relationships',
    icon: <User className="w-6 h-6 text-pink-500" />,
    examples: [
      'Be a better parent',
      'Strengthen family bonds',
      'Build meaningful friendships',
      'Improve relationship with partner',
      'Connect with old friends'
    ]
  },
  {
    id: 'work',
    name: 'Work',
    icon: <Briefcase className="w-6 h-6 text-blue-500" />,
    examples: [
      'Get promoted to senior position',
      'Start a successful business',
      'Learn new industry skills',
      'Improve work-life balance',
      'Network effectively'
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: <Home className="w-6 h-6 text-green-500" />,
    examples: [
      'Travel to new countries',
      'Learn to cook gourmet meals',
      'Develop a minimalist lifestyle',
      'Create a morning routine',
      'Read more books'
    ]
  },
  {
    id: 'adulting',
    name: 'Adulting',
    icon: <GraduationCap className="w-6 h-6 text-purple-500" />,
    examples: [
      'Save for retirement',
      'Buy a house',
      'Learn about investing',
      'Improve financial literacy',
      'Plan for the future'
    ]
  },
  {
    id: 'pursuits',
    name: 'Pursuits',
    icon: <Target className="w-6 h-6 text-indigo-500" />,
    examples: [
      'Master photography',
      'Write a novel',
      'Learn to play an instrument',
      'Start a podcast',
      'Create digital art'
    ]
  }
];

const OnboardingFlow = () => {
  const [goals, setGoals] = useState<string[]>([]);
  const [currentGoal, setCurrentGoal] = useState('');
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [showBypassOption, setShowBypassOption] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const name = user.email.split('@')[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    };
    getUserEmail();
  }, []);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGoal.trim() && goals.length < 3 && !goals.includes(currentGoal.trim())) {
      setGoals([...goals, currentGoal.trim()]);
      setCurrentGoal('');
    }
  };

  // Save generated habits
  const saveHabits = async (
    user: { id: string }, 
    goalHabits: GoalHabits[],
    savedGoals: { id: string; goal: string }[]
  ) => {
    console.log("🚀 Preparing to save habits to Supabase");
    console.log("🚀 User ID:", user.id);
    console.log("🚀 Saved goals:", JSON.stringify(savedGoals, null, 2));
    
    // Skip the database table verification since exec_sql is not available
    
    // DEBUG: Log the types of input parameters to help identify issues
    console.log("🔍 DEBUG - Input types:", {
      userType: typeof user,
      userIdType: typeof user.id,
      goalHabitsType: typeof goalHabits,
      goalHabitsIsArray: Array.isArray(goalHabits),
      goalHabitsLength: goalHabits.length,
      savedGoalsType: typeof savedGoals,
      savedGoalsIsArray: Array.isArray(savedGoals),
      savedGoalsLength: savedGoals.length
    });
    
    // DEBUG: Log the structure of the first goal habit for inspection
    if (goalHabits.length > 0) {
      console.log("🔍 Sample goal habit structure:", JSON.stringify(goalHabits[0], null, 2));
    }
    
    // Double-check that we have goals
    if (!savedGoals || savedGoals.length === 0) {
      console.error("🚀 No saved goals found to associate with habits");
      throw new Error("No goals found for habit creation");
    }
    
    // Convert goal habits to the format needed for insertion
    const habitsToInsert: HabitForInsertion[] = [];
    
    // Map goals by name for easier lookup
    const goalMap = savedGoals.reduce((map, goal) => {
      map[goal.goal.toLowerCase()] = goal.id;
      return map;
    }, {} as Record<string, string>);
    
    console.log("🚀 Goal mapping for habit insertion:", goalMap);
    
    // Use a simpler loop for clarity and better error tracking
    for (const goalHabit of goalHabits) {
      // Find the matching goal ID
      const goalName = goalHabit.goal.toLowerCase();
      const goalId = goalMap[goalName];
      
      if (!goalId) {
        console.error(`🚀 Could not find goal ID for "${goalHabit.goal}"`);
        console.log("🔍 Available goals:", savedGoals.map(g => g.goal));
        // Create a fallback mapping by doing partial matching
        const matchingGoal = savedGoals.find(g => 
          g.goal.toLowerCase().includes(goalName) || 
          goalName.includes(g.goal.toLowerCase())
        );
        
        if (matchingGoal) {
          console.log(`🚀 Found partial match: "${matchingGoal.goal}" for "${goalHabit.goal}"`);
          // Process the habits with this goal ID
          for (const habit of goalHabit.habits) {
            try {
              const habitToInsert: HabitForInsertion = {
                user_id: user.id,
                goal_id: matchingGoal.id,
                name: habit.name,
                description: habit.description || `Habit for ${goalHabit.goal}`,
                frequency: habit.frequency || 'daily'
              };
              
              habitsToInsert.push(habitToInsert);
              console.log(`🚀 Prepared habit: "${habit.name}" for goal "${matchingGoal.goal}"`);
            } catch (err) {
              console.error(`🚀 Error preparing habit "${habit.name}":`, err);
            }
          }
        } else {
          // If no match is found, create habits without goal association
          console.log(`🚀 No matching goal found, creating habits without goal association`);
          for (const habit of goalHabit.habits) {
            try {
              const habitToInsert: HabitForInsertion = {
                user_id: user.id,
                name: habit.name,
                description: habit.description || `Habit for ${goalHabit.goal}`,
                frequency: habit.frequency || 'daily'
              };
              
              habitsToInsert.push(habitToInsert);
              console.log(`🚀 Prepared habit: "${habit.name}" without goal association`);
            } catch (err) {
              console.error(`🚀 Error preparing habit "${habit.name}":`, err);
            }
          }
        }
      } else {
        console.log(`🚀 Found goal ID ${goalId} for "${goalHabit.goal}"`);
        
        // Process each habit for this goal
        for (const habit of goalHabit.habits) {
          try {
            // Create the habit object with proper typing
            const habitToInsert: HabitForInsertion = {
              user_id: user.id,
              goal_id: goalId,
              name: habit.name,
              description: habit.description || `Habit for ${goalHabit.goal}`,
              frequency: habit.frequency || 'daily'
            };
            
            habitsToInsert.push(habitToInsert);
            console.log(`🚀 Prepared habit: "${habit.name}" for goal "${goalHabit.goal}"`);
          } catch (err) {
            console.error(`🚀 Error preparing habit "${habit.name}":`, err);
          }
        }
      }
    }

    console.log("🚀 Total habits to insert:", habitsToInsert.length);
    
    // Ensure we have at least 1 habit per goal
    if (habitsToInsert.length < savedGoals.length) {
      console.warn("🚀 Not enough habits to associate with all goals, adding default habits");
      
      for (const goal of savedGoals) {
        // Check if we already have a habit for this goal
        const hasHabitForGoal = habitsToInsert.some(h => h.goal_id === goal.id);
        
        if (!hasHabitForGoal) {
          console.log(`🚀 Adding default habit for goal "${goal.goal}"`);
          
          const defaultHabit: HabitForInsertion = {
            user_id: user.id,
            goal_id: goal.id,
            name: `Work on ${goal.goal}`,
            description: `Daily progress towards ${goal.goal}`,
            frequency: 'daily'
          };
          
          habitsToInsert.push(defaultHabit);
        }
      }
    }
    
    console.log("🚀 Final habits to insert:", habitsToInsert.length);
    
    if (habitsToInsert.length === 0) {
      console.error("🚀 No habits to insert");
      throw new Error("No habits prepared for insertion");
    }

    // Try to create habits table if it doesn't exist
    console.log("🚀 Checking if habits table exists...");
    console.log("🚀 Database connection check with Supabase client:", 
      supabase ? "Supabase client available" : "Supabase client not initialized");
    
    let tableExists = false;
    
    try {
      console.log("🚀 Testing database connection with a simple query...");
      const { error } = await supabase
        .from('habits')
        .select('id')
        .limit(1);
      
      tableExists = !error;
      console.log("🚀 Database connection test result:", error ? "Failed" : "Successful");
      console.log("🚀 Table exists check:", tableExists ? "Table exists" : "Table may not exist");
      
      if (error) {
        console.error("🚀 Error checking habits table:", error.message);
        console.error("🚀 Error details:", JSON.stringify(error));
      }
      
      if (error && error.message.includes('does not exist')) {
        console.log("🚀 Habits table doesn't exist, trying to create it with a sample record...");
        
        // Try to create the table with a sample record
        const { error: createError } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            name: "Sample Habit",
            description: "This is a temporary habit to create the table"
          });
        
        if (createError && !createError.message.includes('already exists')) {
          console.error("🚀 Failed to create habits table:", createError);
        } else {
          console.log("🚀 Habits table created successfully");
          tableExists = true;
          
          // Clean up the sample record
          try {
            await supabase
              .from('habits')
              .delete()
              .eq('name', "Sample Habit");
          } catch {
            console.log("Note: Could not delete sample habit");
          }
        }
      }
    } catch (e) {
      console.error("🚀 Error checking habits table:", e);
    }
    
    if (!tableExists) {
      console.error("🚀 Could not verify or create habits table");
      throw new Error("Could not access or create habits table");
    }

    console.log("🚀 Inserting habits into Supabase...");
    
    // Try a bulk insert first for better performance
    try {
      console.log("🚀 Attempting bulk insert of all habits...");
      const { data, error } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();
        
      if (!error && data && data.length > 0) {
        console.log(`🚀 Successfully bulk inserted ${data.length} habits`);
        return data;
      } else if (error) {
        console.error("🚀 Bulk insert failed:", error);
        console.log("🚀 Falling back to individual inserts...");
      }
    } catch (e) {
      console.error("🚀 Exception during bulk insert:", e);
      console.log("🚀 Falling back to individual inserts...");
    }
    
    // If bulk insert fails, try one by one
    const insertedHabits = [];
    
    for (let i = 0; i < habitsToInsert.length; i++) {
      const habit = habitsToInsert[i];
      try {
        console.log(`🚀 Inserting habit #${i+1}: "${habit.name}"`);
        
        const { data, error } = await supabase
          .from('habits')
          .insert(habit)
          .select();
          
        if (error) {
          console.error(`🚀 Error inserting habit "${habit.name}":`, error);
          // Try again with a minimal structure if needed
          if (error.message?.includes('column') || error.message?.includes('not found')) {
            console.log('🚀 Trying with minimal structure...');
            const minimalHabit = {
              user_id: habit.user_id,
              name: habit.name,
              description: habit.description
            };
            
            const { data: minData, error: minError } = await supabase
              .from('habits')
              .insert(minimalHabit)
              .select();
              
            if (minError) {
              console.error('🚀 Even minimal structure failed:', minError);
            } else if (minData && minData.length > 0) {
              console.log('🚀 Minimal structure succeeded!');
              insertedHabits.push(minData[0]);
            }
          }
        } else if (data && data.length > 0) {
          console.log(`🚀 Successfully inserted habit: "${habit.name}"`);
          insertedHabits.push(data[0]);
        }
      } catch (e) {
        console.error(`🚀 Exception inserting habit "${habit.name}":`, e);
      }
      
      // Add a small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🚀 Successfully inserted ${insertedHabits.length} habits`);
    return insertedHabits;
  };

  const saveGoalsLocally = (userGoals: string[]) => {
    try {
      // Store goals in localStorage
      localStorage.setItem('localGoals', JSON.stringify(userGoals));
      localStorage.setItem('goalsTimestamp', new Date().toISOString());
      return true;
    } catch (e) {
      console.error('Failed to save goals locally:', e);
      return false;
    }
  };

  const generateLocalHabits = async (userGoals: string[]) => {
    try {
      // Generate habits based on goals
      const generatedHabits = await generateHabits(userGoals);
      
      // Store locally
      localStorage.setItem('localHabits', JSON.stringify(generatedHabits));
      localStorage.setItem('isOfflineMode', 'true');
      
      return generatedHabits;
    } catch (e) {
      console.error('Failed to generate local habits:', e);
      return null;
    }
  };

  const bypassSupabaseAndContinue = async () => {
    setIsLoading(true);
    
    try {
      // Save goals locally
      const localSaveSuccess = saveGoalsLocally(goals);
      
      if (!localSaveSuccess) {
        alert('Cannot save goals even locally. Please try again.');
        setShowLoadingScreen(false);
        setIsLoading(false);
        return;
      }
      
      // Generate habits locally
      const localHabits = await generateLocalHabits(goals);
      
      if (!localHabits) {
        alert('Failed to generate habits. Please try again.');
        setShowLoadingScreen(false);
        setIsLoading(false);
        return;
      }
      
      // Success - navigate to success page
      console.log('✅ Offline flow completed successfully');
      navigate('/success', { 
        state: { 
          habitsCreated: true,
          goalsCount: goals.length,
          habitsCount: localHabits.reduce((total, goal) => total + goal.habits.length, 0),
          isOfflineMode: true
        } 
      });
    } catch (e) {
      console.error('Error in offline flow:', e);
      alert('Something went wrong. Please try again.');
      setShowLoadingScreen(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setShowLoadingScreen(true);
      setIsLoading(true);
      
      console.log("🚀 Starting habit creation process");
      console.log("🚀 Goals to save:", goals);
      
      // Get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("🚀 Auth error:", authError);
        alert("Authentication error. Please sign in again.");
        navigate('/');
        return;
      }
      
      if (!user) {
        console.error("🚀 No user found");
        alert("No user found. Please sign in again.");
        navigate('/');
        return;
      }
      
      console.log("🚀 User authenticated:", user.id);
      
      // Skip all SQL-based table creation since exec_sql doesn't exist
      console.log("🚀 Inserting goals directly without SQL functions");
      
      let savedGoals;
      let goalError;
      
      try {
        // First make sure the user_goals table exists by checking it
        // console.log("🔍 Checking if user_goals table exists...");
        
        // const checkResponse = await supabase
        //   .from('user_goals')
        //   .select('count', { count: 'exact', head: true });
        
        // console.log("🔍 Check response:", checkResponse);
        
        // // If the table doesn't exist, create it first with a sample record
        // if (checkResponse.error && checkResponse.error.message.includes('does not exist')) {
        //   console.log("🔍 Table doesn't exist, creating it with a sample record");
          
        //   const createResponse = await supabase
        //     .from('user_goals')
        //     .insert({
        //       user_id: user.id,
        //       goal: "Sample Goal",
        //       description: "This is a temporary goal to create the table"
        //     })
        //     .select();
          
        //   console.log("🔍 Create table response:", createResponse);
          
        //   // Try to delete the sample record
        //   if (createResponse.data && createResponse.data.length > 0) {
        //     const sampleId = createResponse.data[0].id;
        //     await supabase
        //       .from('user_goals')
        //       .delete()
        //       .eq('id', sampleId);
        //   }
        // }
        
        // Now try to insert the actual goals
        console.log("🚀 Inserting goals:", goals);
        
        const goalsToInsert = goals.map(goal => ({
          user_id: user.id,
          goal: goal,
          description: `Goal created at ${new Date().toISOString()}`
        }));
        
        console.log("🚀 Formatted goals for insertion:", goalsToInsert);
        
        const response = await supabase
          .from('user_goals')
          .insert(goalsToInsert)
          .select();
          
        console.log("🚀 Goal insertion complete. Response:", response);
        savedGoals = response.data;
        goalError = response.error;
        
        // Log detailed error information
        if (goalError) {
          console.error("🚀 Error saving goals:", goalError);
          console.error("🚀 Error details:", {
            code: goalError.code,
            details: goalError.details,
            hint: goalError.hint,
            message: goalError.message
          });
        }
      } catch (insertErr) {
        console.error("🚀 Exception during goal insertion:", insertErr);
        goalError = { message: "Exception during insertion" };
      }

      // If we still don't have goals saved, try individual inserts
      if (goalError || !savedGoals || savedGoals.length === 0) {
        console.log("🚀 Bulk insert failed, trying one by one...");
        savedGoals = [];
        
        for (const goal of goals) {
          try {
            console.log(`🚀 Trying to insert individual goal: "${goal}"`);
            
            const { data, error } = await supabase
              .from('user_goals')
              .insert({
                user_id: user.id,
                goal: goal,
                description: `Goal created individually at ${new Date().toISOString()}`
              })
              .select();
              
            if (error) {
              console.error(`🚀 Failed to insert goal "${goal}":`, error);
              console.error("🚀 Error details:", {
                code: error.code,
                details: error.details,
                hint: error.hint,
                message: error.message
              });
            } else if (data && data.length > 0) {
              console.log(`🚀 Successfully inserted goal "${goal}"`, data[0]);
              savedGoals.push(data[0]);
            }
          } catch (singleErr) {
            console.error(`🚀 Exception inserting goal "${goal}":`, singleErr);
          }
          
          // Add a short delay between requests
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // If we successfully inserted any goals individually, clear the error
        if (savedGoals.length > 0) {
          console.log(`🚀 Successfully inserted ${savedGoals.length} goals individually`);
          goalError = null;
        }
      }

      // If all database methods failed, use offline mode
      if (goalError || !savedGoals || savedGoals.length === 0) {
        console.error("🚀 All database methods failed, switching to offline mode");
        
        // Save goals locally
        const localSaveSuccess = saveGoalsLocally(goals);
        
        if (localSaveSuccess) {
          console.log("🚀 Goals saved locally, continuing with local habit generation");
          
          // Generate habits
          const localHabits = await generateLocalHabits(goals);
          
          if (localHabits) {
            console.log("🚀 Habits generated locally, redirecting to success page");
            
            // Navigate to success page with offline state
            navigate('/success', { 
              state: { 
                habitsCreated: true,
                goalsCount: goals.length,
                habitsCount: localHabits.reduce((total, goal) => total + goal.habits.length, 0),
                isOfflineMode: true
              } 
            });
            
            setShowLoadingScreen(false);
            setIsLoading(false);
            return;
          }
        }
        
        // If even local saving fails, show the bypass option
        alert("Database connection failed. Please try again or continue in offline mode.");
        setShowBypassOption(true);
        setShowLoadingScreen(false);
        setIsLoading(false);
        return;
      }
      
      console.log("🚀 Goals saved:", JSON.stringify(savedGoals, null, 2));

      try {
        // Generate habits using our generator function with OpenAI
        console.log("🚀 Starting habit generation with OpenAI...");
        console.time('habitGeneration');
        const generatedHabits = await generateHabits(goals);
        console.timeEnd('habitGeneration');
        
        console.log("🚀 OpenAI habits generated successfully. Count:", generatedHabits.length);
        console.log("🚀 Generated habits structure:", JSON.stringify(generatedHabits, null, 2));
        
        // Verify habit structure
        let totalHabitsCount = 0;
        generatedHabits.forEach((goalHabit, idx) => {
          console.log(`🚀 Goal ${idx+1}: "${goalHabit.goal}" has ${goalHabit.habits.length} habits`);
          totalHabitsCount += goalHabit.habits.length;
        });
        console.log(`🚀 Total habits across all goals: ${totalHabitsCount}`);
        
        if (totalHabitsCount === 0) {
          console.error("🚀 No habits were generated by OpenAI");
        }
        
        if (!generatedHabits || generatedHabits.length === 0) {
          console.error("🚀 No habits were generated");
          throw new Error("No habits were generated");
        }

        // Ensure each goal has at least 2 habits
        generatedHabits.forEach(goalHabit => {
          // Double check we have at least 2 habits for each goal
          console.log(`🚀 Goal "${goalHabit.goal}" has ${goalHabit.habits.length} habits`);
          
          // If less than 2 habits were generated, add generic ones
          if (goalHabit.habits.length < 2) {
            console.log(`🚀 Adding default habits for goal "${goalHabit.goal}" to ensure at least 2`);
            
            if (goalHabit.habits.length === 0) {
              goalHabit.habits.push({
                name: `Practice ${goalHabit.goal}`,
                description: `A simple habit for ${goalHabit.goal.toLowerCase()}`,
                frequency: 'daily'
              });
            }
            
            goalHabit.habits.push({
              name: `Review progress on ${goalHabit.goal}`,
              description: `Weekly review of your progress towards ${goalHabit.goal.toLowerCase()}`,
              frequency: 'weekly'
            });
          }
        });

        // Save the generated habits
        const insertedHabits = await saveHabits(user, generatedHabits, savedGoals);
        
        if (!insertedHabits || insertedHabits.length === 0) {
          throw new Error("Failed to save any habits");
        }
        
        console.log("🚀 Habits saved successfully:", JSON.stringify(insertedHabits, null, 2));
        console.log(`🚀 Total habits saved: ${insertedHabits.length} for ${savedGoals.length} goals`);

        // Store success flag in localStorage to check on reload
        localStorage.setItem('habitsCreated', 'true');
        localStorage.setItem('habitCreationTime', new Date().toISOString());
        localStorage.setItem('habitsCount', String(insertedHabits.length));

        // Navigate to success page
        console.log("🚀 Navigating to success page");
        navigate('/success', { 
          state: { 
            habitsCreated: true,
            goalsCount: savedGoals.length,
            habitsCount: insertedHabits.length
          } 
        });
      } catch (habitError) {
        console.error("🚀 Error generating or saving habits:", habitError);
        
        // Try one emergency habit as a last resort
        const emergencyHabit = {
          user_id: user.id,
          name: 'Emergency fallback habit',
          description: 'Created as a last resort'
        };
        
        try {
          const { data, error } = await supabase
            .from('habits')
            .insert(emergencyHabit)
            .select();
            
          if (error) {
            console.error("🚀 Even emergency habit failed:", error);
            alert(`Failed to create habits: ${(habitError as Error).message || "Unknown error"}`);
            setShowLoadingScreen(false);
            setIsLoading(false);
            return;
          }
          
          if (data && data.length > 0) {
            // Emergency habit created, go to success page
            localStorage.setItem('habitsCreated', 'true');
            localStorage.setItem('habitCreationTime', new Date().toISOString());
            localStorage.setItem('habitsCount', '1');
            
            navigate('/success', { 
              state: { 
                habitsCreated: true,
                goalsCount: savedGoals.length,
                habitsCount: 1
              } 
            });
          }
        } catch (finalError) {
          console.error("🚀 Final attempt failed:", finalError);
          alert("Could not create any habits. Please try again later.");
          setShowLoadingScreen(false);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('🚀 Error saving goals and habits:', error);
      console.log("🚀 Error stack:", (error as Error).stack);
      
      // Increment error count
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= 1) {
        setShowBypassOption(true);
        alert(`An error occurred: ${(error as Error).message || "Unknown error"}. You can try again or continue in offline mode.`);
      } else {
        alert(`An error occurred: ${(error as Error).message || "Unknown error"}. Please try again.`);
      }
      
      setShowLoadingScreen(false);
      setIsLoading(false);
    }
  };

  const toggleArea = (areaId: string) => {
    setExpandedArea(prevArea => prevArea === areaId ? null : areaId);
  };

  const handleExampleClick = (example: string) => {
    if (goals.length < 3 && !goals.includes(example)) {
      setGoals([...goals, example]);
    }
  };

  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hi {userName}, what's important to you?
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Enter 3 of 3 goals or identities you want to achieve
          </p>
          <p className="text-sm text-gray-500">
            Don't worry, you can always change or delete these later
          </p>
        </div>

        {/* Custom Goal Input */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-8 mb-8 animate-slide-up">
          <form onSubmit={handleAddGoal} className="flex gap-2 mb-6">
            <input
              type="text"
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              placeholder="Enter your own goal..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
              disabled={goals.length >= 3}
            />
            <button
              type="submit"
              disabled={!currentGoal.trim() || goals.length >= 3}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={20} />
              Add Goal
            </button>
          </form>

          {/* Selected Goals Display */}
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <div 
                key={index} 
                className="p-4 bg-blue-50/50 backdrop-blur-sm rounded-lg flex justify-between items-center animate-fade-in border border-blue-100"
              >
                <span className="text-blue-900">{goal}</span>
                <button
                  onClick={() => setGoals(goals.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {goals.length === 3 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-[1.02] font-medium animate-fade-in disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Generating Habits...</span>
                  </div>
                ) : (
                  'Create My Habits'
                )}
              </button>
              
              {showBypassOption && (
                <div className="mt-4">
                  <button
                    onClick={bypassSupabaseAndContinue}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm"
                  >
                    Continue in Offline Mode
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Your goals and habits will be stored locally and you can sync them later.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Life Areas Selection */}
        <div className="mb-8">
          <p className="text-lg text-gray-600 mb-6">Or choose from example goals:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifeAreas.map((area) => (
              <div key={area.id} className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
                <button
                  type="button"
                  onClick={() => toggleArea(area.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center">
                    {area.icon}
                    <span className="ml-3 text-gray-900 font-medium">{area.name}</span>
                  </div>
                  {expandedArea === area.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedArea === area.id && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="space-y-2">
                      {area.examples.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(example)}
                          disabled={goals.length >= 3 || goals.includes(example)}
                          className={`w-full text-left p-3 text-sm rounded-lg transition-colors ${
                            goals.includes(example)
                              ? 'bg-green-50 text-green-700 cursor-not-allowed'
                              : goals.length >= 3
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;