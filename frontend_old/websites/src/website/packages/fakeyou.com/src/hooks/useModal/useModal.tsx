import { useContext } from "react";
import { ModalContext } from "components/providers";

export default function useInferenceJobs() {
  return useContext(ModalContext);
}
