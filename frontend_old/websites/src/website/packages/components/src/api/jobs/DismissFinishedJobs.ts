import MakeRequest from "../MakeRequest";

export interface DismissFinishedJobsRequest {}

export interface DismissFinishedJobsResponse {
  success: boolean;
}

export const DismissFinishedJobs = MakeRequest<
  string,
  DismissFinishedJobsRequest,
  DismissFinishedJobsResponse,
  {}
>({
  method: "POST",
  routingFunction: (jobToken: string) => `/v1/jobs/session/dismiss_finished`,
});
