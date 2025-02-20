import React, { createContext, useState, useEffect } from "react";
import { TreeEditMapI } from "./TreeEditMapProvider";
import { DocumentViewMapI } from "./DocumentViewProvider";

interface GlobalContextType {
  globalState: {
    treeEditContext?: TreeEditMapI;
    DocumentViewMapI?: DocumentViewMapI;
    treeToDocument: Record<string, string>;
  };
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalContextType['globalState']>>;
}

export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);
export const ParentProvider: React.FC<{children: React.ReactNode }> = ({ children }) => {
  const [globalState, setGlobalState] = useState<GlobalContextType['globalState']>({
    treeToDocument: {}
  });

  return (
    <GlobalContext.Provider value={{globalState, setGlobalState}}>
      {children}
    </GlobalContext.Provider>
  );
};