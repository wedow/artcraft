import React, { useState } from "react";
import PageHeader from "components/layout/PageHeader";
import {
  Checkbox,
  Container,
  NumberSlider,
  Panel,
  TempSelect as Select,
} from "components/common";
import { WebUrl } from "../../../../../common/WebUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBomb } from "@fortawesome/free-solid-svg-icons";
import { KillJobs } from "@storyteller/components/src/api/moderation/queues/KillJobs";
import {
  WeightsCategories,
  WeightsFilters,
} from "components/entities/EntityTypes";
import { useSession } from "hooks";

export default function ModerationJobControlPage() {
  const { sessionWrapper } = useSession();
  const [filter, filterSet] = useState<string | undefined>();
  const objNumKeys = (obj = {}) =>
    Object.keys(obj)
      .filter((val: any) => isNaN(Number(val)))
      .filter((val: any) => val !== "all");
  const weightCategories = objNumKeys(WeightsCategories);
  const weightTypes = objNumKeys(WeightsFilters);
  const makeOptions = (filters: string[]) =>
    filters.map((filter, i) => ({ label: filter, value: filter }));
  const categoryOpts = makeOptions(weightCategories);
  const typeOpts = makeOptions(weightTypes);
  const groupedOpts = [
    { label: "ALL JOBS", value: "all_jobs" },
    { label: "Categories", options: categoryOpts },
    { label: "Types", options: typeOpts },
  ];
  const isCategory = weightCategories.indexOf(filter || "") >= 0;
  const [killPendingJobs, setKillPendingJobs] = useState<boolean>(true);
  const [killFailedJobs, setKillFailedJobs] = useState<boolean>(true);
  const [killStartedJobs, setKillStartedJobs] = useState<boolean>(true);
  const [priorityLevel, setPriorityLevel] = useState<number>(0);

  const killJobs = async () => {
    let jobStatuses = [];

    if (killPendingJobs) {
      jobStatuses.push("pending");
    }
    if (killFailedJobs) {
      jobStatuses.push("failed");
    }
    if (killStartedJobs) {
      jobStatuses.push("started");
    }

    const request = {
      job_statuses: jobStatuses,
      target:
        filter === "all_jobs"
          ? filter
          : { [isCategory ? "category" : "model_type"]: filter }, // *
      maybe_priority_or_lower: priorityLevel,
    };

    // * NB: The backend uses parameterized enums, so the request shape here is unusual

    await KillJobs(request);
  };

  const checkboxEventStatus = (
    ev: React.FormEvent<HTMLInputElement>
  ): boolean => {
    return (ev.target as HTMLInputElement).checked;
  };

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  const priorityGroups = [
    "logged out users",
    "free users",
    "loyalty users",
    "premium users",
  ];
  let groupList = [...priorityGroups];

  groupList.length = priorityLevel + 1;

  return (
    <Container type="panel" className="mb-5">
      <PageHeader
        {...{
          back: { to: WebUrl.moderationMain(), label: "Back to moderation" },
          title: "Kill Jobs",
          subText: "(Only do this in emergencies!)",
        }}
      />
      <Panel {...{ padding: true }}>
        <Select
          {...{
            className: "abc",
            label: "Kill a category or weight type",
            options: groupedOpts,
            onChange: ({ target }) => {
              filterSet(target.value);
            },
            placeholder: "Select a category or type",
            value: filter,
          }}
        />
        <h6>With these job statuses</h6>
        <div {...{ className: "d-flex gap-3" }}>
          <Checkbox
            {...{
              checked: killFailedJobs,
              label: "Failed",
              onChange: (ev: any) => setKillFailedJobs(checkboxEventStatus(ev)),
            }}
          />
          <Checkbox
            {...{
              checked: killPendingJobs,
              label: "Pending",
              onChange: (ev: any) =>
                setKillPendingJobs(checkboxEventStatus(ev)),
            }}
          />
          <Checkbox
            {...{
              checked: killStartedJobs,
              label: "Started",
              onChange: (ev: any) =>
                setKillStartedJobs(checkboxEventStatus(ev)),
            }}
          />
        </div>

        <NumberSlider
          {...{
            label: "For these user priority levels or below",
            onChange: ({ target }: { target: any }) => {
              setPriorityLevel(target.value);
            },
            value: priorityLevel,
            min: 0,
            max: 3,
          }}
        />
        <p {...{ className: "mt-3" }}>
          This will kill jobs for {groupList.join(", ")}
        </p>

        <div className="py-6">
          <div className="d-flex flex-column gap-3">
            <button
              className="btn btn-destructive w-100"
              onClick={() => killJobs()}
            >
              Kill Jobs&nbsp;
              <FontAwesomeIcon icon={faBomb} />
            </button>
          </div>
        </div>
      </Panel>
    </Container>
  );
}
