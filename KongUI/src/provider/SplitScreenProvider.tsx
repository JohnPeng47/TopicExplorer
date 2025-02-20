import React, { createContext, useState, useContext, ReactNode } from 'react';

enum DisplayMode {
  full = 'full',
  split = 'split'
}

interface SplitScreenContextType {
  displayMode: DisplayMode;
  activeScreen: string;
  toggleSplitScreen: () => void;
  setActiveScreen: (screen: string) => void;
}

const SplitScreenContext = createContext<SplitScreenContextType | undefined>(undefined);
const SplitScreenProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.full);
  const [activeScreen, setActiveScreen] = useState<string>('left');
  
  const toggleSplitScreen = () => {
    setDisplayMode((prevMode) => (prevMode === DisplayMode.full ? DisplayMode.split : DisplayMode.full));
  };

  return (
    <SplitScreenContext.Provider value={{ displayMode, activeScreen, toggleSplitScreen, setActiveScreen }}>
      {children}
    </SplitScreenContext.Provider>
  );
};

const useSplitScreen = () => {
  const context = useContext(SplitScreenContext);
  if (!context) {
    throw new Error('useSplitScreen must be used within a SplitScreenProvider');
  }
  return context;
};

export { DisplayMode, SplitScreenProvider, useSplitScreen };