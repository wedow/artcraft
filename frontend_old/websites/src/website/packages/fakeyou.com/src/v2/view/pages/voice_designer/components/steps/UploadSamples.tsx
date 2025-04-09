import React, { useEffect, useState } from "react";
import { AudioInput } from "components/common";
import moment from "moment";
import ListItems from "../NewList";
import { v4 as uuidv4 } from "uuid";
import { ListSamplesForDataset } from "@storyteller/components/src/api/voice_designer/voice_dataset_samples/ListSamplesForDataset";
import { UploadSample } from "@storyteller/components/src/api/voice_designer/voice_dataset_samples/UploadSample";
import { DeleteSample } from "@storyteller/components/src/api/voice_designer/voice_dataset_samples/DeleteSample";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWaveform } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  audioProps: any;
  datasetToken?: string;
  deleting: any;
  deletingSet: any;
  inProgress: any;
  inProgressSet: any;
  samples: any;
  samplesSet: any;
}

function UploadSamples({
  audioProps,
  datasetToken,
  deleting,
  deletingSet,
  inProgress,
  inProgressSet,
  samples,
  samplesSet,
}: Props) {
  const [listFetched, listFetchedSet] = useState(false);

  const SampleBadge = () => (
    <FontAwesomeIcon icon={faWaveform} className="me-2 me-lg-3" />
  );

  const sampleClick =
    () =>
      ({ target }: { target: any }) => {
        let sampleToken =
          samples[target.name.split(",")[0].split(":")[1]].sample_token;
        deletingSet([...deleting, sampleToken]); // add to deleting list
        DeleteSample(sampleToken, { as_mod: false, set_delete: true }).then(
          res => {
            listFetchedSet(false);
            deletingSet(deleting.filter((item: any) => item === sampleToken)); // remove from deleting list
          }
        );
      };

  const actionSamples = [
    // these spread operators combine the inProgress and sample arrays
    ...inProgress,
    ...samples.map((sample: any, i: number) => {
      let date = new Date(sample.created_at);
      return {
        ...sample,
        badge: SampleBadge,
        buttons: [
          {
            label: "Delete",
            small: true,
            variant: "secondary",
            onClick: sampleClick(),
          },
        ],
        name: `Sample from ${date ? moment(date).format("MMMM Do YYYY, h:mm a") : ""
          }`,
      };
    }),
  ];

  useEffect(() => {
    if (audioProps.file && datasetToken) {
      let uuid_idempotency_token = uuidv4();
      audioProps.clear();
      inProgressSet([
        // add sample to in progress list
        {
          //  badge: Component // this can be a loading indicator
          name: "Uploading",
          uuid_idempotency_token,
        },
        ...inProgress,
      ]);
      UploadSample("", {
        dataset_token: datasetToken || "",
        file: audioProps.file,
        uuid_idempotency_token,
      }).then(res => {
        if (res.success) {
          inProgressSet(
            inProgress.filter(
              (
                item: any // removes sample from in progress list
              ) => item.uuid_idempotency_token === uuid_idempotency_token
            )
          );
          listFetchedSet(false); // refetches sample list
        } else {
          // @ts-ignore
          window.dataLayer.push({
            "event": "upload_failure",
            "page": "/voice-designer/create",
            "user_id": "$user_id"
          });
        }
      });
    }

    if (datasetToken && !listFetched) {
      listFetchedSet(true);
      ListSamplesForDataset(datasetToken, {}).then(res => {
        if (res.success && res.samples) {
          samplesSet(res.samples);
        }
      });
    }
  }, [
    audioProps,
    datasetToken,
    listFetched,
    inProgress,
    inProgressSet,
    samplesSet,
  ]);

  return (
    <div>
      <label className="sub-title">Upload Audio</label>
      <div className="d-flex flex-column gap-3 upload-component">
        <AudioInput {...{ ...audioProps }} />
        {actionSamples.length ? (
          <ListItems {...{ data: actionSamples, isLoading: false }} />
        ) : (
          <div className="panel panel-inner text-center p-5 rounded-5 h-100">
            <div className="d-flex flex-column opacity-75 h-100 justify-content-center">
              <FontAwesomeIcon icon={faWaveform} className="fs-3 mb-3" />
              <h5>No voice samples yet</h5>
              <p>Uploaded samples will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { UploadSamples };
