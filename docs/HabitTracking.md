# Habit Tracking System Documentation

This document explains how the habit tracking system works, including how habits are stored, tracked, and displayed over different time periods.

## Database Schema

### Tables

1. **user_goals**
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `goal`: TEXT
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP

2. **habits**
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `goal_id`: UUID (references user_goals.id)
   - `name`: TEXT
   - `description`: TEXT
   - `created_at`: TIMESTAMP

3. **habit_completions**
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `habit_id`: TEXT (references habits.id)
   - `completed_date`: DATE
   - `status`: TEXT
   - `created_at`: TIMESTAMP
   - With a UNIQUE constraint on (user_id, habit_id, completed_date)

## Data Flow

1. **User Goals**: Users define goals during onboarding
2. **Habits**: Each goal has associated habits
3. **Habit Completions**: When a user completes a habit, a record is stored in habit_completions

## Habit Completion Process

When a user marks a habit as completed:

1. A record is added to the `habit_completions` table with:
   - The habit's unique ID
   - The current user's ID
   - The date of completion (in YYYY-MM-DD format)
   - Status value of 'completed'

When a user unchecks a completed habit:
1. The corresponding record is deleted from the `habit_completions` table

## Time-Based Tracking

The system allows tracking habits over different time periods:

### Daily View
- Query completions for a specific date
- Example query:
  ```sql
  SELECT * FROM habit_completions 
  WHERE user_id = '123' 
  AND completed_date = '2023-05-15'
  ```

### Weekly View
- Query completions for a date range (current week)
- Example query:
  ```sql
  SELECT * FROM habit_completions 
  WHERE user_id = '123' 
  AND completed_date BETWEEN '2023-05-15' AND '2023-05-21'
  ```

### Monthly View
- Aggregate completions by habit across a month
- Example query:
  ```sql
  SELECT habit_id, COUNT(*) as completion_count 
  FROM habit_completions 
  WHERE user_id = '123' 
  AND completed_date BETWEEN '2023-05-01' AND '2023-05-31'
  GROUP BY habit_id
  ```

### Yearly View
- Aggregate completions by month for a yearly overview
- Example query:
  ```sql
  SELECT 
    EXTRACT(MONTH FROM completed_date) as month, 
    COUNT(*) as completion_count 
  FROM habit_completions 
  WHERE user_id = '123' 
  AND completed_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY EXTRACT(MONTH FROM completed_date)
  ```

## Streak Tracking

Streaks can be calculated by finding consecutive days with completions:

```sql
WITH dates AS (
  SELECT 
    habit_id, 
    completed_date,
    LAG(completed_date) OVER (PARTITION BY habit_id ORDER BY completed_date) as prev_date
  FROM habit_completions
  WHERE user_id = '123' AND habit_id = '456'
  ORDER BY completed_date
)
SELECT 
  habit_id,
  COUNT(*) + 1 as streak_length
FROM dates
WHERE (completed_date - prev_date) = 1
GROUP BY habit_id;
```

## Client-Side Implementation

The front-end application maintains the following states:

1. **Goals**: List of user goals with associated habits
2. **Habit Completions**: A record of completed habits
3. **Weekly Dates**: The dates displayed in the current week view

When a user checks/unchecks a habit:

1. The UI is updated immediately for a responsive experience
2. An API call is made to Supabase to update the `habit_completions` table
3. Error handling ensures the UI stays in sync with the database
4. Detailed logging tracks the process for debugging

## Placeholder Habits

For new habits or those created from templates:

1. A placeholder ID is assigned temporarily (format: `placeholder-{uuid}`)
2. When the user first interacts with the habit, a real database record is created
3. The placeholder ID is replaced with the database ID

## Analytics Possibilities

The data structure supports various analytics:

1. **Completion Rate**: Percentage of habits completed over time
2. **Streak Analysis**: Identifying longest streaks
3. **Goal Progress**: Seeing which goals have the most habit completions
4. **Time-Based Patterns**: Identifying days of the week with highest completion rates

## Future Enhancements

Potential system improvements:

1. **Habit Scheduling**: Set specific days for habits
2. **Reminders**: Notification system for uncompleted habits
3. **Social Features**: Share progress or compete with friends
4. **Advanced Analytics**: Visualizations of progress over time 