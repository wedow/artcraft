import { useEffect, useState } from "react";
import { faBell, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu } from "~/components/reusable/Popover";
import { CompletedCard } from "./CompletedCard";
import { InProgressCard } from "./InProgressCard";
import { useJobContext } from "~/components/JobContext";
import { Api } from "~/KonvaApp/Api";
import { toast } from "sonner";

// Dummy data types
interface CompletedItem {
  token: string;
  maybe_title: string;
  public_bucket_path: string;
  updated_at: string;
}

interface ActiveJob {
  job_token: string;
  request: {
    maybe_model_title: string;
  };
  status: {
    status: string;
    progress_percentage: number;
  };
}

// Dummy data for testing
const dummyCompletedItems: CompletedItem[] = [
  {
    token: "1",
    maybe_title: "Completed Item 1",
    public_bucket_path: "/test1",
    updated_at: new Date().toISOString(),
  },
  {
    token: "2",
    maybe_title: "Completed Item 2",
    public_bucket_path: "/test2",
    updated_at: new Date().toISOString(),
  },
];

// const dummyJobs: ActiveJob[] = [
//   {
//     job_token: "job1",
//     request: {
//       maybe_model_title: "In Progress Job 1",
//     },
//     status: {
//       status: "STARTED",
//       progress_percentage: 45,
//     },
//   },
//   {
//     job_token: "job2",
//     request: {
//       maybe_model_title: "In Progress Job 2",
//     },
//     status: {
//       status: "PENDING",
//       progress_percentage: 0,
//     },
//   },
// ];

export function Activity() {
  const { jobTokens, addJobToken, removeJobToken, clearJobTokens } =
    useJobContext();
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollData = async () => {
      if (jobTokens.length > 0) {
        console.log("Current Job Tokens:", jobTokens);
        const api = new Api();

        // Create a map to store the latest job data
        const updatedJobs = new Map<string, ActiveJob>();

        for (const jobToken of jobTokens) {
          const job = await api.pollJobSession(jobToken);

          if (job.success && job.data) {
            const { status, progress_percentage } = job.data.status;
            const { job_token } = job.data;

            if (
              status.toLowerCase() === "complete_success" ||
              status.toLowerCase() === "failed"
            ) {
              // If job is complete_success or failed, we'll remove it later
              removeJobToken(job_token);

              // Add to complete_success items if it was successful
              if (status.toLowerCase() === "complete_success") {
                const newCompletedItem: CompletedItem = {
                  token: job_token,
                  maybe_title:
                    job.data.request.maybe_model_title || "Image Generation",
                  public_bucket_path: job.data.result.image_url || "",
                  updated_at: new Date().toISOString(),
                };
                toast.success("Done Processing Image");
                setCompletedItems((prev) => [newCompletedItem, ...prev]);
              }
            } else {
              // Store the job in our map
              const updatedJob: ActiveJob = {
                job_token,
                request: {
                  maybe_model_title:
                    job.data.request.maybe_model_title || "Image Generation",
                },
                status: {
                  status: status.toUpperCase(),
                  progress_percentage: progress_percentage || 0,
                },
              };
              updatedJobs.set(job_token, updatedJob);
            }
          } else {
            console.error("Failed to fetch job status:", job.errorMessage);
          }
        }

        // Update jobs state with the deduplicated jobs
        setJobs(Array.from(updatedJobs.values()));
      }
      if (jobTokens.length === 0) {
        setJobs([]);
        setLoading(false);
      }
    };

    // Initial load
    // Initial call to pollData
    pollData();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(async () => {
      await pollData();
    }, 5000);

    return () => clearInterval(interval);
  }, [jobTokens, removeJobToken]);

  return (
    <PopoverMenu
      mode="default"
      buttonClassName="h-[42px] px-4"
      panelClassName="w-[360px] p-2"
      position="bottom"
      align="end"
      triggerIcon={
        <div>
          <span className="text-md flex items-center gap-2">
            <>
              {jobs.length > 0 ? (
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="animate-spin"
                />
              ) : (
                <FontAwesomeIcon icon={faBell} />
              )}
              Activity
            </>
          </span>
          {jobs.length > 0 && (
            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-blue-500" />
          )}
        </div>
      }
    >
      <div className="max-h-[480px] overflow-y-auto">
        {/* In progress */}
        {jobs.length > 0 && (
          <div>
            {jobs.map((job) => (
              <InProgressCard key={job.job_token} job={job} />
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
            <FontAwesomeIcon
              icon={faSpinnerThird}
              spin
              size="2x"
              className="text-gray-400"
            />
            <h3 className="text-gray-300">Retrieving Activities</h3>
          </div>
        ) : completedItems.length === 0 && jobs.length === 0 ? (
          <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
            <h3 className="text-gray-300">No activities yet</h3>
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
  );
}
