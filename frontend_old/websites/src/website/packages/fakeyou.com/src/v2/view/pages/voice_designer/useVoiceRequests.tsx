import { useEffect, useState } from "react";

// voice imports

import { GetVoice } from "@storyteller/components/src/api/voice_designer/voices/GetVoice";
import {
  CreateVoice,
  CreateVoiceRequest,
  CreateVoiceResponse,
} from "@storyteller/components/src/api/voice_designer/voices/CreateVoice";
import {
  ListVoicesByUser,
  Voice,
} from "@storyteller/components/src/api/voice_designer/voices/ListVoicesByUser";
import {
  DeleteVoice,
  // DeleteVoiceRequest, use me somewhere pls
  DeleteVoiceResponse,
} from "@storyteller/components/src/api/voice_designer/voices/DeleteVoice";
import { UpdateVoice } from "@storyteller/components/src/api/voice_designer/voices/UpdateVoice";

// dataset imports

import { GetDataset } from "@storyteller/components/src/api/voice_designer/voice_datasets/GetDataset";
import {
  ListDatasetsByUser,
  Dataset,
} from "@storyteller/components/src/api/voice_designer/voice_datasets/ListDatasetsByUser";
import {
  DeleteDataset,
  DeleteDatasetResponse,
} from "@storyteller/components/src/api/voice_designer/voice_datasets/DeleteDataset";
import {
  CreateDataset,
  CreateDatasetRequest,
  CreateDatasetResponse,
} from "@storyteller/components/src/api/voice_designer/voice_datasets/CreateDataset";
import {
  UpdateDataset,
  UpdateDatasetRequest,
  UpdateDatasetResponse,
} from "@storyteller/components/src/api/voice_designer/voice_datasets/UpdateDataset";
import { EnqueueTts } from "@storyteller/components/src/api/voice_designer/inference/EnqueueTts";
import { useSession } from "hooks";

export default function useVoiceRequests({
  requestDatasets = false,
  requestVoices = false,
}) {
  // this state will be provided as params, triggering the appropriate api call if present
  const [datasets, datasetsSet] = useState<Dataset[]>([]);
  const [voices, voicesSet] = useState<Voice[]>([]);

  // 0 =  paused, 1 = requested, 2 = started, 3 = success, we could even do 4 for errors
  const [datasetStatus, datasetStatusSet] = useState(requestDatasets ? 1 : 0);
  const [voicesStatus, voicesStatusSet] = useState(requestVoices ? 1 : 0);

  const isBusy = (status: number) => status === 1 || status === 2;

  const { user } = useSession();
  // const [timestamp, timestampSet] = useState(Date.now());

  const refreshData = () => {
    datasetStatusSet(1);
    voicesStatusSet(1);
  }; // later we can do refresh per list

  const createDataset = (
    urlRouteArgs: string,
    request: CreateDatasetRequest
  ): Promise<CreateDatasetResponse> =>
    CreateDataset(urlRouteArgs, request).then((res) => {
      // refreshData(); // not needed because creating a dataset navigates to the upload page with no lists
      return res;
    });

  const createVoice = (
    urlRouteArgs: string,
    request: CreateVoiceRequest
  ): Promise<CreateVoiceResponse> =>
    CreateVoice(urlRouteArgs, request).then((res) => {
      // refreshData(); // not needed because creating a voice navigates to a new page with a new instance of useVoiceRequest
      return res;
    });

  const deleteVoice = (voiceToken: string): Promise<DeleteVoiceResponse> =>
    DeleteVoice(voiceToken, {
      set_delete: true,
      as_mod: false,
    }).then((res) => {
      refreshData();
      return res;
    });

  const deleteDataset = (voiceToken: string): Promise<DeleteDatasetResponse> =>
    DeleteDataset(voiceToken, {
      set_delete: true,
      as_mod: false,
    }).then((res) => {
      refreshData();
      return res;
    });

  const datasetByToken = (datasetToken?: string) =>
    datasets.filter(
      ({ dataset_token }, i) => datasetToken === dataset_token
    )[0];

  const editDataSet = (
    datasetToken: string,
    request: UpdateDatasetRequest
  ): Promise<UpdateDatasetResponse> => {
    return UpdateDataset(datasetToken, request).then((res) => {
      refreshData();
      return res;
    });
  };

  const listDatasets = () => {
    datasetStatusSet(1);
    return datasets;
  };

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
  ];

  const visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Hidden", value: "hidden" },
  ];

  useEffect(() => {
    if (user && user.username) {
      if (datasetStatus === 1) {
        datasetStatusSet(2);
        ListDatasetsByUser(user.username, {}).then((res) => {
          datasetStatusSet(3);
          if (res.datasets) datasetsSet(res.datasets);
        });
      }
      if (voicesStatus === 1) {
        voicesStatusSet(2);
        ListVoicesByUser(user.username, {}).then((res) => {
          voicesStatusSet(3);
          if (res.voices) voicesSet(res.voices);
        });
      }
    }
  }, [user, datasetStatus, voicesStatus]);

  return {
    datasets: {
      byToken: datasetByToken,
      create: createDataset,
      delete: deleteDataset,
      edit: editDataSet,
      get: GetDataset,
      list: datasets,
      listDatasets,
      refresh: refreshData,
    },
    inference: {
      enqueue: EnqueueTts,
    },
    isLoading: isBusy(datasetStatus) || isBusy(voicesStatus),
    languages,
    visibilityOptions,
    voices: {
      create: createVoice,
      delete: deleteVoice,
      get: GetVoice,
      list: voices,
      refresh: refreshData,
      update: UpdateVoice,
    },
    inputCtrl:
      (todo: any) =>
      ({ target }: { target: any }) => { todo(target.value); },
  };
}
