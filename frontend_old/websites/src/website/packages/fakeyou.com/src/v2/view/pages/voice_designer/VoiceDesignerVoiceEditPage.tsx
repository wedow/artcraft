import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  faEye,
  faLanguage,
  faWaveform,
} from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import Panel from "components/common/Panel";
import PageHeader from "components/layout/PageHeader";
import Container from "components/common/Container";
import TempInput from "components/common/TempInput";
import { Button, TempSelect } from "components/common";
import useVoiceRequests from "./useVoiceRequests";
import { useHistory } from "react-router-dom";

export default function VoiceDesignerVoiceEditPage() {
  const [language, languageSet] = useState("en");
  const [visibility, visibilitySet] = useState("hidden");
  const [title, titleSet] = useState("");

  const [fetched, fetchedSet] = useState(false);

  const history = useHistory();
  const { voice_token } = useParams();

  const { inputCtrl, languages, visibilityOptions, voices } = useVoiceRequests(
    {}
  );

  usePrefixedDocumentTitle("Edit Voice");

  const onClick = () =>
    voices
      .update(voice_token, {
        title,
        creator_set_visibility: visibility,
        ietf_language_tag: language,
      })
      .then((res: any) => {
        if (res && res.success) {
          history.push("/voice-designer");
        }
      });

  useEffect(() => {
    if (!fetched && voice_token) {
      fetchedSet(true);
      voices.get(voice_token, {}).then(res => {
        languageSet(res.ietf_language_tag);
        titleSet(res.title);
        visibilitySet(res.creator_set_visibility);
      });
    }
  }, [fetched, voice_token, voices]);

  return (
    <Container type="panel">
      <PageHeader
        title="Edit Voice"
        titleIcon={faWaveform}
        subText="Make changes to your voice details"
        panel={false}
        showBackButton={true}
        backbuttonLabel="Back to Voice Designer"
        backbuttonTo="/voice-designer"
      />

      <Panel>
        <div className="p-3 py-4 p-md-4">
          <TempInput
            {...{
              label: "Title",
              placeholder: "Voice name",
              onChange: inputCtrl(titleSet),
              value: title,
            }}
          />

          <TempSelect
            {...{
              icon: faLanguage,
              label: "Language",
              // placeholder: "Voice name",
              onChange: inputCtrl(languageSet),
              options: languages,
              value: language,
            }}
          />

          <TempSelect
            {...{
              icon: faEye,
              label: "Visibility",
              // placeholder: "Voice name",
              onChange: inputCtrl(visibilitySet),
              options: visibilityOptions,
              value: visibility,
            }}
          />
        </div>
        <hr className="mt-0 mb-4" />
        <div className="p-3 pb-4 px-lg-4 pt-0">
          <div className="d-flex gap-3 justify-content-end">
            <Button
              {...{
                label: "Cancel",
                to: "/voice-designer",
                variant: "secondary",
              }}
            />
            <Button {...{ label: "Save Changes", onClick }} />
          </div>
        </div>
      </Panel>
    </Container>
  );
}
