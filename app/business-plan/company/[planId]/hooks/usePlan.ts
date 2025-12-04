'use client';

import { createContext, useContext } from 'react';
import { BusinessPlanData } from '@/components/BusinessPlanForm';

interface PlanContextType {
  plan: (BusinessPlanData & { id: string }) | null;
  loading: boolean;
  reloadPlan: () => Promise<void>;
}

export const PlanContext = createContext<PlanContextType>({ 
  plan: null, 
  loading: true,
  reloadPlan: async () => {},
});

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanContext.Provider');
  }
  return context;
};



