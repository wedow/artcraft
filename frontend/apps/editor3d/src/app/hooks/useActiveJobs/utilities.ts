import { ToastTypes } from "~/enums";
import { addToast, setJobs } from "~/signals";
import { JobsApi } from "~/Classes/ApiManager/JobsApi";
export async function PollRecentJobs() {
  const jobsApi = new JobsApi();

  const response = await jobsApi.ListRecentJobs();
  if (response.success && response.data) {
    setJobs(response.data);
    // else, just no jobs, not an error, do nothing
    return;
  }
  addToast(
    ToastTypes.ERROR,
    response.errorMessage || "Unknown Error: List Recent Jobs",
  );
}
