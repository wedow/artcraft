import { useSignals } from "@preact/signals-react/runtime";
import { faBell, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu } from "~/components/reusable/Popover/Popover";
import { CompletedCard } from "./CompletedCard";
import { InProgressCard } from "./InProgressCard";
import { H3, P, Tooltip } from "~/components";
import { activeImageGenerationJobs, toasts, userMovies } from "~/signals";
import { useEffect, useState } from "react";
import { JobsApi } from "~/Classes/ApiManager/JobsApi";
import { toast } from "sonner";
import { ActiveJob } from "~/pages/PageEnigma/models";
// TODO ensure we de-dupe all this extra code.
interface CompletedItem {
  token: string;
  maybe_title: string;
  public_bucket_path: string;
  updated_at: string;
}

// {
//   "job_token": "jinf_421nnr6rj8wy2sj0s11v9fns32s",
//   "request": {
//       "inference_category": "image_generation",
//       "maybe_model_type": "image_gen_api",
//       "maybe_model_token": null,
//       "maybe_model_title": "Image Generation",
//       "maybe_raw_inference_text": null,
//       "maybe_style_name": null,
//       "maybe_live_portrait_details": null,
//       "maybe_lipsync_details": null
//   },
//   "status": {
//       "status": "complete_success",
//       "maybe_extra_status_description": null,
//       "maybe_assigned_worker": "inference-job-4o-image-848c55d5dd-555kn",
//       "maybe_assigned_cluster": "storyteller-eks-1",
//       "maybe_first_started_at": "2025-04-15T04:41:01Z",
//       "maybe_current_execution_duration_seconds": null,
//       "attempt_count": 1,
//       "requires_keepalive": false,
//       "maybe_failure_category": null,
//       "progress_percentage": 100
//   },
//   "maybe_result": {
//       "entity_type": "media_file",
//       "entity_token": "m_ytrjp1fcd5tb43ebcs3ewhq6y05tfb",
//       "maybe_public_bucket_media_path": "/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//       "media_links": {
//           "cdn_url": "https://cdn-2.fakeyou.com/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//           "maybe_thumbnail_template": "https://cdn-2.fakeyou.com/cdn-cgi/image/width={WIDTH},quality=95/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//           "maybe_video_previews": null
//       },
//       "maybe_successfully_completed_at": "2025-04-15T04:42:14Z"
//   },
//   "created_at": "2025-04-15T04:41:01Z",
//   "updated_at": "2025-04-15T04:42:14Z"
// }

export function Activity() {
  useSignals();
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);

  useEffect(() => {
    const pollData = async () => {
      const fetchJobs = async () => {
        try {
          const jobsApi = new JobsApi();
          const jobsResponse = await jobsApi.ListRecentJobs();

          if (jobsResponse.success && jobsResponse.data) {
            // Process active jobs
            const activeJobs = jobsResponse.data
              .filter((job) => {
                const status = job.status?.status?.toLowerCase();
                return (
                  status && status !== "complete_success" && status !== "failed"
                );
              })
              .map((job) => ({
                job_token: job.job_token,
                request: {
                  maybe_model_title:
                    job.request?.maybe_model_title || "Image Generation",
                },
                status: {
                  status: job.status?.status?.toUpperCase() || "",
                  progress_percentage: job.status?.progress_percentage || 0,
                },
              }));

            // Process completed items
            // Get completed items and filter out any that are already in our list
            const successfulJobs = jobsResponse.data.filter(
              (job) => job.status?.status?.toLowerCase() === "complete_success",
            );

            // Create a set of existing tokens for faster lookup
            const existingTokens = new Set(
              completedItems.map((item) => item.token),
            );

            // Filter out jobs we already have in our list
            const newCompletedItems = successfulJobs
              .filter((job) => !existingTokens.has(job.job_token))
              .map((job) => ({
                token: job.job_token,
                maybe_title:
                  job.request?.maybe_model_title || "Image Generation",
                public_bucket_path:
                  job.maybe_result?.maybe_public_bucket_media_path || "",
                updated_at: job.updated_at || new Date().toISOString(),
              }));

            // Show toast notification for newly completed items
            if (newCompletedItems.length > 0) {
              const count = newCompletedItems.length;
              const message =
                count === 1
                  ? `${newCompletedItems[0].maybe_title} completed successfully`
                  : `${count} images completed successfully`;
              toast.success(message);
            }

            // Update completed items with a maximum limit of 50 items
            setCompletedItems((prev) => {
              const combined = [...newCompletedItems, ...prev];
              // Remove duplicates based on token
              const uniqueItems = Array.from(
                new Map(combined.map((item) => [item.token, item])).values(),
              );
              // Sort by updated_at in descending order and limit to 50 items
              return uniqueItems
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime(),
                )
                .slice(0, 50);
            });
            setJobs(activeJobs as ActiveJob[]);
            setLoading(false);
          }
        } catch (error) {
          toast.error("Error Fetching Recent Jobs");
          console.error("Failed to fetch recent jobs:", error);
        }
      };
      await fetchJobs();
    };

    // Initial load
    // Initial call to pollData
    pollData();
    // Set up polling interval (every 5 seconds)
    const interval = setInterval(async () => {
      await pollData();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip content="Activity" position="bottom" closeOnClick={true}>
      <PopoverMenu
        mode="default"
        buttonClassName="h-[38px] w-[38px] !p-0"
        panelClassName="w-[360px] p-2"
        position="bottom"
        align="end"
        triggerIcon={
          <div>
            {jobs && jobs.length > 0 ? (
              <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faBell} />
            )}
            {jobs && jobs.length > 0 && (
              <div className="bg-blue-500 absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full" />
            )}
          </div>
        }
      >
        <div className="max-h-[480px] overflow-y-auto">
          {/* In progress */}
          {jobs && jobs.length > 0 && (
            <div>
              {jobs.map((job) => (
                <InProgressCard key={job.job_token} job={job} />
              ))}
            </div>
          )}

          {!userMovies.value && !activeImageGenerationJobs.value ? (
            <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
              <FontAwesomeIcon
                icon={faSpinnerThird}
                spin
                size="2x"
                className="text-gray-400"
              />
              <H3 className="text-gray-300">Retrieving Activities</H3>
            </div>
          ) : userMovies.value &&
            userMovies.value.length === 0 &&
            !activeImageGenerationJobs.value ? (
            <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
              <H3 className="text-gray-300">No activities yet</H3>
              <P className="text-gray-400">
                Try generating something new from the featured scenes
              </P>
            </div>
          ) : (
            <div>
              {/* Completed */}
              <div className="flex flex-col">
                {completedItems.map((item) => (
                  <CompletedCard key={item.token} job={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverMenu>
    </Tooltip>
  );
}
