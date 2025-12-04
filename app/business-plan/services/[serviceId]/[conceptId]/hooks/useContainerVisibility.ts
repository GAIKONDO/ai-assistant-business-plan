'use client';

import { createContext, useContext } from 'react';

interface ContainerVisibilityContextType {
  showContainers: boolean;
  setShowContainers: (show: boolean) => void;
}

export const ContainerVisibilityContext = createContext<ContainerVisibilityContextType | undefined>(undefined);

export const useContainerVisibility = () => {
  const context = useContext(ContainerVisibilityContext);
  if (context === undefined) {
    throw new Error('useContainerVisibility must be used within a ContainerVisibilityProvider');
  }
  return context;
};


