import React, { createContext, useContext, useState } from "react";

interface JobContextType {
  jobToken: string | null;
  setJobToken: (token: string | null) => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jobToken, setJobToken] = useState<string | null>(null);

  return (
    <JobContext.Provider value={{ jobToken, setJobToken }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobContext must be used within a JobProvider");
  }
  return context;
};
