import { useSignals } from "@preact/signals-react/runtime";
import { faBell, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu } from "~/components/reusable/Popover/Popover";
import { CompletedCard } from "./CompletedCard";
import { InProgressCard } from "./InProgressCard";
import { H3, P, Tooltip } from "~/components";
import { activeImageGenerationJobs, userMovies } from "~/signals";

export function Activity() {
  useSignals();

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
            <FontAwesomeIcon icon={faBell} />
            {activeImageGenerationJobs.value &&
              activeImageGenerationJobs.value.length > 0 && (
                <div className="bg-blue-500 absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full" />
              )}
          </div>
        }
      >
        <div className="max-h-[480px] overflow-y-auto">
          {/* In progress */}
          {activeImageGenerationJobs.value &&
            activeImageGenerationJobs.value.length > 0 && (
              <div>
                {activeImageGenerationJobs.value.map((movieJob) => (
                  <InProgressCard key={movieJob.job_token} movie={movieJob} />
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
                {userMovies.value?.map((movie) => (
                  <CompletedCard key={movie.token} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverMenu>
    </Tooltip>
  );
}
