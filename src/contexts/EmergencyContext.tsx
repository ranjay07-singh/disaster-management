import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EmergencyRequest } from '../types/User';

interface EmergencyContextType {
  activeEmergency: EmergencyRequest | null;
  setActiveEmergency: (emergency: EmergencyRequest | null) => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

interface EmergencyProviderProps {
  children: ReactNode;
}

export const EmergencyProvider: React.FC<EmergencyProviderProps> = ({ children }) => {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);

  return (
    <EmergencyContext.Provider value={{ activeEmergency, setActiveEmergency }}>
      {children}
    </EmergencyContext.Provider>
  );
};
