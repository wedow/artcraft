import { useContext } from "react";
import { SessionContext } from "components/providers/SessionProvider";

export default function useInferenceJobs() {
  return useContext(SessionContext);
};