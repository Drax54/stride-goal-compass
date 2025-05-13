
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart } from 'lucide-react';

export type ViewType = 'daily' | 'weekly' | 'monthly' | 'analytics';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex space-x-2 bg-muted p-1 rounded-lg">
      <Button
        variant={currentView === 'daily' ? 'default' : 'ghost'}
        className={
          currentView === 'daily' 
            ? 'bg-white text-accent hover:text-accent hover:bg-white' 
            : 'text-muted-foreground'
        }
        size="sm"
        onClick={() => onViewChange('daily')}
      >
        <span className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          Daily
        </span>
      </Button>
      <Button
        variant={currentView === 'weekly' ? 'default' : 'ghost'}
        className={
          currentView === 'weekly' 
            ? 'bg-white text-accent hover:text-accent hover:bg-white' 
            : 'text-muted-foreground'
        }
        size="sm"
        onClick={() => onViewChange('weekly')}
      >
        Weekly
      </Button>
      <Button
        variant={currentView === 'monthly' ? 'default' : 'ghost'}
        className={
          currentView === 'monthly' 
            ? 'bg-white text-accent hover:text-accent hover:bg-white' 
            : 'text-muted-foreground'
        }
        size="sm"
        onClick={() => onViewChange('monthly')}
      >
        Monthly
      </Button>
      <Button
        variant={currentView === 'analytics' ? 'default' : 'ghost'}
        className={
          currentView === 'analytics' 
            ? 'bg-white text-accent hover:text-accent hover:bg-white' 
            : 'text-muted-foreground'
        }
        size="sm"
        onClick={() => onViewChange('analytics')}
      >
        <span className="flex items-center">
          <BarChart className="mr-1 h-4 w-4" />
          Analytics
        </span>
      </Button>
    </div>
  );
}

export default ViewSelector;
