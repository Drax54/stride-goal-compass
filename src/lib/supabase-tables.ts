import { supabase } from './supabase';

// Function to check and create database tables
export async function checkTables() {
  console.log('Checking database tables...');
  
  try {
    // Create the extension first if it doesn't exist
    await createUuidExtension();
    
    // Check for and create the necessary tables
    await ensureTablesExist();
    console.log('Database check completed');
  } catch (error) {
    console.error('Database check error:', error);
  }
}

// Create UUID extension if needed
async function createUuidExtension() {
  try {
    // First check if the RPC function exists
    await verifyRpcFunction('exec_sql');
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' 
    });
    
    if (error) {
      console.log('Note: Could not create UUID extension, might already exist or require admin rights');
      console.log('Error details:', error);
    } else {
      console.log('✅ UUID extension created or already exists');
    }
  } catch (err) {
    console.log('Note: UUID extension creation skipped, may already exist');
    console.error('Error details:', err);
  }
}

// Verify if the RPC function exists
export async function verifyRpcFunction(functionName: string): Promise<boolean> {
  console.log(`Checking if RPC function '${functionName}' exists...`);
  
  try {
    // Try to call the function with minimal arguments
    if (functionName === 'exec_sql') {
      const { error } = await supabase.rpc(functionName, { 
        sql: 'SELECT 1;' 
      });
      
      if (error) {
        // Check if the error indicates the function doesn't exist
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.error(`❌ RPC function '${functionName}' does not exist`);
          console.error(`⚠️ Please create this function in your Supabase project:`);
          if (functionName === 'exec_sql') {
            console.error(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN '{"success": true}'::JSONB;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
            `);
          }
          return false;
        } else {
          console.log(`⚠️ Error calling RPC function '${functionName}', but it may exist:`, error);
          return true; // Function might exist but we got a different error
        }
      }
      
      console.log(`✅ RPC function '${functionName}' exists and is working`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`❌ Error checking RPC function '${functionName}':`, err);
    return false;
  }
}

// Alternative function for creating tables when RPC is not available
export async function createTableWithInsert(tableName: string, sampleData: Record<string, unknown>): Promise<boolean> {
  console.log(`Creating '${tableName}' table using insert method...`);
  
  try {
    const { error } = await supabase
      .from(tableName)
      .insert(sampleData);
    
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Failed to create '${tableName}' table:`, error);
      return false;
    }
    
    console.log(`✅ '${tableName}' table created or already exists`);
    return true;
  } catch (err) {
    console.error(`❌ Error creating '${tableName}' table:`, err);
    return false;
  }
}

// Ensure all required tables exist
async function ensureTablesExist() {
  console.log('Ensuring all required tables exist...');

  // Create tables in the correct order
  await createUserGoalsTableIfNeeded();
  await createHabitsTableIfNeeded();
  await createCompletionsTableIfNeeded();
  
  // Double-check that the tables are now accessible
  await verifyTablesAccessible();
}

// Verify that all tables are accessible
async function verifyTablesAccessible() {
  console.log('Verifying table accessibility...');
  
  // Check habits table
  const { error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .limit(1);
  
  if (habitsError) {
    console.error('⚠️ habits table not accessible:', habitsError.message);
  } else {
    console.log('✅ habits table is accessible');
  }
  
  // Check user_goals table
  const { error: goalsError } = await supabase
    .from('user_goals')
    .select('id')
    .limit(1);
  
  if (goalsError) {
    console.error('⚠️ user_goals table not accessible:', goalsError.message);
  } else {
    console.log('✅ user_goals table is accessible');
  }
  
  // Check habit_completions table
  const { error: completionsError } = await supabase
    .from('habit_completions')
    .select('id')
    .limit(1);
  
  if (completionsError) {
    console.error('⚠️ habit_completions table not accessible:', completionsError.message);
  } else {
    console.log('✅ habit_completions table is accessible');
  }
}

// Create user_goals table if needed
async function createUserGoalsTableIfNeeded() {
  const { error: goalsError } = await supabase
    .from('user_goals')
    .select('id')
    .limit(1);
  
  if (goalsError && goalsError.message.includes('does not exist')) {
    console.log('🔄 user_goals table does not exist. Creating it...');
    await createUserGoalsTable();
  } else if (goalsError) {
    console.error('❌ Error accessing user_goals table:', goalsError);
  } else {
    console.log('✅ user_goals table exists');
  }
}

// Check and create habits table if needed
async function createHabitsTableIfNeeded() {
  const { error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .limit(1);
  
  if (habitsError && habitsError.message.includes('does not exist')) {
    console.log('🔄 habits table does not exist. Creating it...');
    await createHabitsTable();
  } else if (habitsError) {
    console.error('❌ Error accessing habits table:', habitsError);
  } else {
    console.log('✅ habits table exists');
  }
}

// Check and create habit_completions table if needed
async function createCompletionsTableIfNeeded() {
  const { error: completionsError } = await supabase
    .from('habit_completions')
    .select('id')
    .limit(1);
    
  if (completionsError && completionsError.message.includes('does not exist')) {
    console.log('🔄 habit_completions table does not exist. Creating it...');
    await createCompletionsTable();
  } else if (completionsError) {
    console.error('❌ Error accessing habit_completions table:', completionsError);
  } else {
    console.log('✅ habit_completions table exists');
  }
}

// Create user_goals table
async function createUserGoalsTable() {
  try {
    console.log('🔧 Creating user_goals table...');
    
    // First, try to create the table using RPC SQL
    let rpcSuccess = false;
    
    if (await verifyRpcFunction('exec_sql')) {
      // Use direct SQL for creating the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_goals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          goal TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.error('❌ Failed to create user_goals table using SQL:', error);
      } else {
        console.log('✅ user_goals table created using SQL');
        rpcSuccess = true;
      }
    } else {
      console.log('⚠️ exec_sql RPC function not available, trying alternative methods');
    }
    
    // If RPC method failed, try the insert method
    if (!rpcSuccess) {
      console.log('🔄 Trying insert method for user_goals table...');
      
      // First try with the expected structure
      const sampleData = {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        goal: 'Temporary Goal'
      };
      
      const insertSuccess = await createTableWithInsert('user_goals', sampleData);
      
      if (insertSuccess) {
        // Clean up the temporary record
        try {
          await supabase
            .from('user_goals')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        } catch {
          console.log('Note: Could not delete temporary goal');
        }
      } else {
        // Try a different column structure as a last resort
        console.log('🔄 Trying again with a different column structure...');
        const fallbackData = {
          id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'Temporary Goal',  // Using 'title' instead of 'goal'
          description: 'This is a temporary goal to create the table'
        };
        
        const fallbackSuccess = await createTableWithInsert('user_goals', fallbackData);
        
        if (fallbackSuccess) {
          // Clean up the temporary record
          try {
            await supabase
              .from('user_goals')
              .delete()
              .eq('id', '00000000-0000-0000-0000-000000000000');
          } catch {
            console.log('Note: Could not delete temporary goal');
          }
        } else {
          console.error('❌ All attempts to create user_goals table failed');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error creating user_goals table:', error);
  }
}

// Create habits table if it doesn't exist
async function createHabitsTable() {
  try {
    console.log('🔧 Creating habits table...');
    
    // Use direct SQL for creating the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        goal_id UUID,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT DEFAULT 'daily',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Failed to create habits table using SQL:', error);
      
      // Fallback to using insert method if SQL approach fails
      const { error: insertError } = await supabase
        .from('habits')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'Temporary Habit',
          description: 'This is a temporary habit to create the table'
        });
      
      if (insertError && !insertError.message.includes('already exists')) {
        console.error('❌ Failed to create habits table via insert:', insertError);
      } else {
        console.log('✅ habits table created through insert method');
        
        // Clean up the temporary record
        try {
          await supabase
            .from('habits')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        } catch {
          console.log('Note: Could not delete temporary habit');
        }
      }
    } else {
      console.log('✅ habits table created using SQL');
    }
  } catch (error) {
    console.error('❌ Error creating habits table:', error);
  }
}

// Create habit_completions table if it doesn't exist
async function createCompletionsTable() {
  try {
    console.log('🔧 Creating habit_completions table...');
    
    // Use direct SQL for creating the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS habit_completions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        habit_id UUID NOT NULL,
        completed_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, completed_date)
      );
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Failed to create habit_completions table using SQL:', error);
      
      // Fallback to using insert method if SQL approach fails
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          habit_id: '00000000-0000-0000-0000-000000000000',
          completed_date: new Date().toISOString().split('T')[0]
        });
      
      if (insertError && !insertError.message.includes('already exists')) {
        console.error('❌ Failed to create habit_completions table via insert:', insertError);
      } else {
        console.log('✅ habit_completions table created through insert method');
        
        // Clean up the temporary record
        try {
          await supabase
            .from('habit_completions')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        } catch {
          console.log('Note: Could not delete temporary completion');
        }
      }
    } else {
      console.log('✅ habit_completions table created using SQL');
    }
  } catch (error) {
    console.error('❌ Error creating habit_completions table:', error);
  }
}

// Run checkTables when imported
console.log('🚀 Initializing database tables...');
checkTables().catch(console.error);

// Save completion locally function
export function saveCompletionLocally(habitId: string, dateStr: string, completed: boolean) {
  // Get existing stored completions
  const localStorageKey = 'habit_completions';
  const storedCompletionsStr = localStorage.getItem(localStorageKey);
  const storedCompletions = storedCompletionsStr ? JSON.parse(storedCompletionsStr) : {};
  
  // Update the completion
  if (!storedCompletions[habitId]) {
    storedCompletions[habitId] = {};
  }
  
  if (completed) {
    storedCompletions[habitId][dateStr] = true;
  } else {
    delete storedCompletions[habitId][dateStr];
    
    // Clean up empty objects
    if (Object.keys(storedCompletions[habitId]).length === 0) {
      delete storedCompletions[habitId];
    }
  }
  
  // Save back to localStorage
  localStorage.setItem(localStorageKey, JSON.stringify(storedCompletions));
  
  return { updated: true };
} 