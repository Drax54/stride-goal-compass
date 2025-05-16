/*
  # Add habit completions table

  1. New Tables
    - `habit_completions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `habit_id` (uuid, references habits)
      - `completed_date` (date)
      - `status` (text, either 'completed' or 'failed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `habit_completions` table
    - Add policies for authenticated users to manage their own completions
*/

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  habit_id uuid REFERENCES habits(id) NOT NULL,
  completed_date date NOT NULL,
  status text CHECK (status IN ('completed', 'failed')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Policies for habit completions
CREATE POLICY "Users can manage their own completions"
  ON habit_completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX habit_completions_user_date_idx ON habit_completions(user_id, completed_date);
CREATE INDEX habit_completions_habit_date_idx ON habit_completions(habit_id, completed_date);