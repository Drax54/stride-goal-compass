
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardHeader } from './DashboardHeader';
import { HabitList } from './HabitList';
import { ViewType } from '@/components/ui/ViewSelector';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('daily');

  return (
    <Layout hideFooter>
      <div className="min-h-screen flex flex-col">
        <DashboardHeader 
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <div className="flex-grow container py-8 px-4 md:px-6">
          <HabitList viewType={currentView} />
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
