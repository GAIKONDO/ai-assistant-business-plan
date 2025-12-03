'use client';

import { createContext, useContext } from 'react';
import { PageMetadata } from '@/types/pageMetadata';

export interface ConceptData {
  id: string;
  name: string;
  description: string;
  conceptId: string;
  serviceId: string;
  keyVisualUrl?: string;
  keyVisualHeight?: number;
  keyVisualScale?: number;
  keyVisualLogoUrl?: string;
  keyVisualMetadata?: {
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
    titleFontSize?: number;
    signatureFontSize?: number;
    dateFontSize?: number;
  };
  pagesBySubMenu?: { [subMenuId: string]: Array<PageMetadata> }; // メタデータ付きページ
  pageOrderBySubMenu?: { [subMenuId: string]: string[] };
}

interface ConceptContextType {
  concept: ConceptData | null;
  loading: boolean;
  reloadConcept: () => Promise<void>;
}

export const ConceptContext = createContext<ConceptContextType>({ 
  concept: null, 
  loading: true, 
  reloadConcept: async () => {} 
});

export const useConcept = () => {
  const context = useContext(ConceptContext);
  if (context === undefined) {
    throw new Error('useConcept must be used within a ConceptContext.Provider');
  }
  return context;
};

