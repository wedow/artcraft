import { useState } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { demoAudioItems } from "~/pages/PageEnigma/signals";

import {
  Button,
  FilterButtons,
  Pagination,
  UploadAudioButtonDialogue,
} from "~/components";

import { AudioItemElements } from "./audioItemElements";
import { TabTitle } from "~/pages/PageEnigma/comps/SidePanelTabs/sharedComps/TabTitle";
import { InferenceElement } from "./audioInferenceElement";
import { AssetFilterOption } from "~/enums";
import { AudioTabPages } from "~/pages/PageEnigma/enums";

import { activeAudioJobs, userAudioItems } from "~/signals";

export const PageAudioLibrary = ({
  changePage,
  reloadLibrary,
}: {
  changePage: (newPage: AudioTabPages) => void;
  reloadLibrary: () => void;
}) => {
  useSignals();

  const [selectedFilter, setSelectedFilter] = useState(AssetFilterOption.MINE);
  const filteredAudioItems =
    selectedFilter === AssetFilterOption.FEATURED
      ? demoAudioItems.value ?? []
      : userAudioItems.value ?? [];
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 20;
  const totalPages = Math.ceil(filteredAudioItems.length / pageSize);

  return (
    <>
      <TabTitle title="Audio" />
      <FilterButtons
        value={selectedFilter}
        onClick={(buttonIdx) => {
          setSelectedFilter(Number(buttonIdx));
          setCurrentPage(0);
        }}
      />

      <div className="flex w-full gap-3 px-4">
        <UploadAudioButtonDialogue onUploaded={reloadLibrary} />
        <Button
          className="grow py-3 text-sm font-medium"
          icon={faCirclePlus}
          variant="action"
          onClick={() => changePage(AudioTabPages.GENERATE_AUDIO)}
        >
          Generate Audio
        </Button>
      </div>

      <div className="w-full grow overflow-y-auto px-4">
        {activeAudioJobs.value && activeAudioJobs.value.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-2">
            {activeAudioJobs.value.map((job) => {
              return <InferenceElement key={job.job_token} job={job} />;
            })}
          </div>
        )}
        <AudioItemElements
          currentPage={currentPage}
          pageSize={pageSize}
          items={filteredAudioItems}
        />
      </div>
      {totalPages > 1 && (
        <Pagination
          className="-mt-4 px-4"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage: number) => {
            setCurrentPage(newPage);
          }}
        />
      )}
      <span className="w-full" />
    </>
  );
};
