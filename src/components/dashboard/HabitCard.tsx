
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Check, X } from 'lucide-react';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  streak: number;
  completed: boolean | null;
  color: string;
}

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onMiss: (id: string) => void;
  onReset: (id: string) => void;
}

export function HabitCard({ habit, onComplete, onMiss, onReset }: HabitCardProps) {
  let statusClass = '';
  let statusName = '';
  
  if (habit.completed === true) {
    statusClass = 'border-habit-green';
    statusName = 'Completed';
  } else if (habit.completed === false) {
    statusClass = 'border-habit-red';
    statusName = 'Missed';
  }
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md animate-scale-in ${statusClass}`}>
      <div className={`h-1 w-full bg-habit-${habit.color}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-semibold">
          <div className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-habit-${habit.color}/10 text-habit-${habit.color}`}>
            <Target className="h-4 w-4" />
          </div>
          {habit.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {habit.description && <p className="text-sm text-muted-foreground">{habit.description}</p>}
        <div className="mt-2 flex items-center text-sm">
          <span className="font-medium">Current streak: </span>
          <span className="ml-1 font-bold text-accent">{habit.streak} days</span>
        </div>
        {habit.goal && (
          <div className="mt-2">
            <span className="text-xs font-medium text-muted-foreground">Goal: {habit.goal}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {habit.completed === null ? (
          <div className="flex w-full space-x-2">
            <Button 
              className="flex-1 bg-habit-green hover:bg-habit-green/90"
              size="sm"
              onClick={() => onComplete(habit.id)}
            >
              <Check className="mr-1 h-4 w-4" /> Complete
            </Button>
            <Button 
              className="flex-1 bg-habit-red hover:bg-habit-red/90"
              size="sm"
              onClick={() => onMiss(habit.id)}
            >
              <X className="mr-1 h-4 w-4" /> Miss
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <Button 
              variant="outline" 
              className="w-full"
              size="sm"
              onClick={() => onReset(habit.id)}
            >
              Reset
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default HabitCard;
