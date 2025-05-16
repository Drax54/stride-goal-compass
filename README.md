
# Habit Tracker Application

A full-featured habit tracking application built with React, TypeScript, and Supabase.

## Features

- User authentication
- Goal setting and habit creation
- Daily, weekly, monthly, and yearly habit tracking
- Analytics and progress visualization
- Onboarding flow for new users

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Add the following script to your package.json file:
   ```json
   "build:dev": "vite build --mode development"
   ```
4. Run the development server with `npm run dev`

## Supabase Integration

This project uses Supabase for authentication and data storage. Make sure your Supabase connection is properly configured.

## Project Structure

- `/src/components` - React components
- `/src/components/auth` - Authentication components
- `/src/components/onboarding` - Onboarding flow components
- `/src/components/views` - Different view components (day, week, month, year)
- `/src/lib` - Utility functions and API clients
- `/src/types` - TypeScript type definitions
