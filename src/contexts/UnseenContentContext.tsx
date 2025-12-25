import React, { createContext, useContext, ReactNode } from 'react';
import { useUnseenContent } from '@/hooks/useUnseenContent';

interface UnseenContentContextType {
  unseenEnrollments: Set<string>;
  unseenRounds: Set<string>;
  hasUnseenCourses: boolean;
  hasUnseenRounds: boolean;
  markEnrollmentViewed: (enrollmentId: string) => Promise<void>;
  markRoundViewed: (roundId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const UnseenContentContext = createContext<UnseenContentContextType | undefined>(undefined);

export const UnseenContentProvider = ({ children }: { children: ReactNode }) => {
  const unseenContent = useUnseenContent();
  
  return (
    <UnseenContentContext.Provider value={unseenContent}>
      {children}
    </UnseenContentContext.Provider>
  );
};

export const useUnseenContentContext = () => {
  const context = useContext(UnseenContentContext);
  if (context === undefined) {
    throw new Error('useUnseenContentContext must be used within an UnseenContentProvider');
  }
  return context;
};
