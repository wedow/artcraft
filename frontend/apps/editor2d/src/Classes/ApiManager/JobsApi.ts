import { ApiManager, ApiResponse } from "./ApiManager";
import { Job, JobPreview } from "./models/Job";

export class JobsApi extends ApiManager {
  public GetPreviewStatusByJobToken({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<JobPreview>> {
    console.log(token);

    const endpoint = `${this.ApiTargets.BaseApi}/v1/workflows/preview_status/${token}`;

    return this.get<ApiResponse<JobPreview>>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.data,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public GetJobByToken({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<Job>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/jobs/job/${token}`;

    return this.get<{
      success: boolean;
      state: Job;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.state,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListRecentJobs(): Promise<ApiResponse<Job[]>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/jobs/session`;

    return this.get<{
      success: boolean;
      jobs: Job[];
      error_reason?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.jobs,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteJobByToken(jobToken: string): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/jobs/job/${jobToken}`;

    return this.delete<
      undefined,
      {
        success: boolean;
      }
    >({ endpoint })
      .then((response) => ({
        success: response.success,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
